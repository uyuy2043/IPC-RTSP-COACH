#!/usr/bin/env python3
"""RTSP 1.0 教学客户端。

现场模式会向你拥有的摄像机发送 OPTIONS、DESCRIBE、SETUP（TCP 交织）、
PLAY、读取 RTP，然后 TEARDOWN。--self-test 只检查离线函数，不连网。
"""

import argparse
import hashlib
import re
import secrets
import socket
import sys
import time
from urllib.parse import urlsplit, urlunsplit


def md5_hex(text):
    return hashlib.md5(text.encode("utf-8")).hexdigest()


def digest_response(username, realm, password, method, uri, nonce, qop=None, nc=None, cnonce=None):
    """RFC 2617。qop=auth 时把 nc、cnonce 放进 response。"""
    ha1 = md5_hex(username + ":" + realm + ":" + password)
    ha2 = md5_hex(method + ":" + uri)
    if qop:
        material = ":".join([ha1, nonce, nc or "", cnonce or "", qop, ha2])
    else:
        material = ":".join([ha1, nonce, ha2])
    return md5_hex(material)


_USERINFO = re.compile(r"(rtsps?://[^:/\s]+):([^@/\s]+)@")


def redact(text):
    """把 URL 里的口令换成 ***。"""
    return _USERINFO.sub(r"\1:***@", text)


def resolve_control(base, control):
    """把 SDP 的 a=control 解析成绝对 RTSP 地址。"""
    control = control.strip()
    if control == "*":
        return base
    if "://" in control:
        return control
    if control.startswith("/"):
        parts = urlsplit(base)
        return urlunsplit((parts.scheme, parts.netloc, control, "", ""))
    if base.endswith("/"):
        return base + control
    parts = urlsplit(base)
    slash = parts.path.rfind("/")
    if slash < 0:
        path = "/" + control
    else:
        path = parts.path[: slash + 1] + control
    return urlunsplit((parts.scheme, parts.netloc, path, "", ""))


def hikvision_stream_id(channel, sub):
    stream = 2 if sub else 1
    return channel * 100 + stream


def hikvision_path(channel, sub=False):
    """海康直播路径。通道从 1 计，主码流为 1，子码流为 2。"""
    return "/Streaming/Channels/%d" % hikvision_stream_id(channel, sub)


def parse_session(value):
    """Session 头。返回 (会话号, timeout 秒或 None)。"""
    ident, _, params = value.partition(";")
    timeout = None
    for part in params.split(";"):
        item = part.strip()
        if item.startswith("timeout="):
            number = item.split("=", 1)[1].strip()
            if number:
                timeout = int(number)
    return ident.strip(), timeout


def parse_rtp(packet):
    """解析 RTP 固定头。版本不是 2 时说明还没对齐。"""
    if len(packet) < 12:
        raise ValueError("RTP header needs 12 bytes")
    first = packet[0]
    second = packet[1]
    version = first >> 6
    padding = (first >> 5) & 1
    extension = (first >> 4) & 1
    cc = first & 0x0F
    marker = (second >> 7) & 1
    payload_type = second & 0x7F
    sequence = (packet[2] << 8) | packet[3]
    timestamp = (packet[4] << 24) | (packet[5] << 16) | (packet[6] << 8) | packet[7]
    ssrc = (packet[8] << 24) | (packet[9] << 16) | (packet[10] << 8) | packet[11]
    offset = 12 + 4 * cc
    if extension:
        if len(packet) < offset + 4:
            raise ValueError("RTP extension truncated")
        words = (packet[offset + 2] << 8) | packet[offset + 3]
        offset += 4 + words * 4
    return {
        "version": version,
        "padding": padding,
        "extension": extension,
        "cc": cc,
        "marker": marker,
        "payload_type": payload_type,
        "sequence": sequence,
        "timestamp": timestamp,
        "ssrc": ssrc,
        "payload_offset": offset,
    }


def parse_sdp(text):
    """拆出会话字段和每一路媒体的属性。"""
    session = {"fields": {}, "attributes": [], "medias": []}
    current = None
    normalized = text.replace("\r\n", "\n")
    for raw in normalized.split("\n"):
        line = raw.strip()
        if not line or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key == "m":
            parts = value.split()
            current = {
                "kind": parts[0] if parts else "",
                "port": parts[1] if len(parts) > 1 else "",
                "proto": parts[2] if len(parts) > 2 else "",
                "fmt": parts[3:],
                "attributes": [],
            }
            session["medias"].append(current)
            continue
        if key == "a":
            if current is None:
                session["attributes"].append(value)
            else:
                current["attributes"].append(value)
            continue
        if current is None:
            session["fields"][key] = value
    return session


def header_param(text, name):
    quoted = re.search(r'(?:^|[,\s])' + re.escape(name) + r'="([^"]*)"', text, re.I)
    if quoted:
        return quoted.group(1)
    bare = re.search(r'(?:^|[,\s])' + re.escape(name) + r"=([^,\s]+)", text, re.I)
    if bare:
        return bare.group(1).strip().strip('"')
    return ""


def parse_challenge(value):
    qop = header_param(value, "qop")
    chosen = ""
    for item in qop.split(","):
        if item.strip() == "auth":
            chosen = "auth"
            break
    return {
        "realm": header_param(value, "realm"),
        "nonce": header_param(value, "nonce"),
        "opaque": header_param(value, "opaque"),
        "qop": chosen,
    }


def presentation_uri(url):
    parts = urlsplit(url)
    host = parts.hostname or ""
    if parts.port:
        netloc = "%s:%d" % (host, parts.port)
    else:
        netloc = host
    path = parts.path or "/"
    return urlunsplit((parts.scheme or "rtsp", netloc, path, parts.query, ""))


def status_code(head):
    line = head.split("\r\n", 1)[0]
    bits = line.split(" ")
    if len(bits) < 2 or not bits[1].isdigit():
        raise ValueError("bad status line")
    return int(bits[1])


def header_map(head):
    found = {}
    for line in head.split("\r\n")[1:]:
        if ":" not in line:
            continue
        name, value = line.split(":", 1)
        found[name.strip().lower()] = value.strip()
    return found


def content_length(head):
    headers = header_map(head)
    raw = headers.get("content-length", "0")
    return int(raw or "0")


def encode_request(method, uri, cseq, headers):
    lines = [
        "%s %s RTSP/1.0" % (method, uri),
        "CSeq: %d" % cseq,
        "User-Agent: rtsp-coach",
    ]
    for name in headers:
        lines.append("%s: %s" % (name, headers[name]))
    return ("\r\n".join(lines) + "\r\n\r\n").encode("utf-8")


def video_control(sdp):
    for media in sdp["medias"]:
        if media["kind"] != "video":
            continue
        for attr in media["attributes"]:
            if attr.startswith("control:"):
                return attr.split(":", 1)[1].strip()
    return "*"


class Reader(object):
    def __init__(self, sock):
        self.sock = sock
        self.buf = b""

    def _pull(self):
        chunk = self.sock.recv(4096)
        if not chunk:
            raise IOError("connection closed")
        self.buf += chunk

    def read_response(self):
        while b"\r\n\r\n" not in self.buf:
            self._pull()
        head, _, rest = self.buf.partition(b"\r\n\r\n")
        self.buf = rest
        text = head.decode("utf-8", "replace")
        length = content_length(text)
        while len(self.buf) < length:
            self._pull()
        body = self.buf[:length]
        self.buf = self.buf[length:]
        return text, body

    def read_event(self):
        while True:
            if self.buf.startswith(b"$"):
                if len(self.buf) < 4:
                    self._pull()
                    continue
                length = (self.buf[2] << 8) | self.buf[3]
                total = 4 + length
                if len(self.buf) < total:
                    self._pull()
                    continue
                channel = self.buf[1]
                payload = self.buf[4:total]
                self.buf = self.buf[total:]
                return "media", channel, payload
            if b"\r\n\r\n" in self.buf:
                text, body = self.read_response()
                return "rtsp", text, body
            self._pull()


class Client(object):
    def __init__(self, url, timeout):
        parts = urlsplit(url)
        if not parts.hostname:
            raise ValueError("URL 里没有主机")
        self.url = url
        self.username = parts.username or ""
        self.password = parts.password or ""
        self.host = parts.hostname
        self.port = parts.port or 554
        self.uri = presentation_uri(url)
        self.timeout = timeout
        self.cseq = 0
        self.nc = 0
        self.cnonce = secrets.token_hex(8)
        self.challenge = None
        self.sock = None
        self.reader = None

    def authorization(self, method, uri):
        qop = self.challenge.get("qop") or ""
        nc = "%08x" % self.nc
        response = digest_response(
            self.username,
            self.challenge.get("realm") or "",
            self.password,
            method,
            uri,
            self.challenge.get("nonce") or "",
            qop or None,
            nc if qop else None,
            self.cnonce if qop else None,
        )
        parts = [
            'username="%s"' % self.username,
            'realm="%s"' % (self.challenge.get("realm") or ""),
            'nonce="%s"' % (self.challenge.get("nonce") or ""),
            'uri="%s"' % uri,
            'response="%s"' % response,
        ]
        if qop:
            parts.append("qop=%s" % qop)
            parts.append("nc=%s" % nc)
            parts.append('cnonce="%s"' % self.cnonce)
        opaque = self.challenge.get("opaque") or ""
        if opaque:
            parts.append('opaque="%s"' % opaque)
        return "Digest " + ", ".join(parts)

    def transact(self, method, uri, extra):
        retried = False
        while True:
            headers = {}
            for name in extra:
                headers[name] = extra[name]
            if self.challenge:
                self.nc += 1
                headers["Authorization"] = self.authorization(method, uri)
            self.cseq += 1
            payload = encode_request(method, uri, self.cseq, headers)
            self.sock.sendall(payload)
            head, body = self.reader.read_response()
            code = status_code(head)
            hdrs = header_map(head)
            if code == 401 and not retried:
                if not self.username:
                    raise IOError("401，但 URL 里没有用户名")
                self.challenge = parse_challenge(hdrs.get("www-authenticate", ""))
                self.nc = 0
                retried = True
                continue
            return code, hdrs, body

    def open(self):
        self.sock = socket.create_connection((self.host, self.port), self.timeout)
        self.sock.settimeout(self.timeout)
        self.reader = Reader(self.sock)

    def close(self):
        if self.sock is not None:
            self.sock.close()
            self.sock = None

    def run(self, seconds):
        print("连接 %s" % redact(self.uri))
        self.open()
        try:
            code, _, _ = self.transact("OPTIONS", self.uri, {})
            print("OPTIONS %d" % code)
            code, hdrs, body = self.transact("DESCRIBE", self.uri, {"Accept": "application/sdp"})
            print("DESCRIBE %d" % code)
            if code != 200:
                return 1
            sdp = parse_sdp(body.decode("utf-8", "replace"))
            base = hdrs.get("content-base") or self.uri
            control = resolve_control(base, video_control(sdp))
            setup_headers = {"Transport": "RTP/AVP/TCP;unicast;interleaved=0-1"}
            code, hdrs, _ = self.transact("SETUP", control, setup_headers)
            print("SETUP %d" % code)
            if code != 200:
                return 1
            ident, timeout = parse_session(hdrs.get("session", ""))
            if timeout is None:
                print("Session %s" % ident)
            else:
                print("Session %s timeout=%d" % (ident, timeout))
            play_headers = {"Session": ident, "Range": "npt=0.000-"}
            self.cseq += 1
            play_extra = {}
            for name in play_headers:
                play_extra[name] = play_headers[name]
            if self.challenge:
                self.nc += 1
                play_extra["Authorization"] = self.authorization("PLAY", self.uri)
            self.sock.sendall(encode_request("PLAY", self.uri, self.cseq, play_extra))
            response, packets, first = self._collect(seconds)
            if response is None:
                print("PLAY 没有应答")
                return 1
            play_code = status_code(response[0])
            print("PLAY %d" % play_code)
            if first is None:
                print("RTP 包 0")
            else:
                print(
                    "RTP 包 %d pt=%d seq=%d"
                    % (packets, first["payload_type"], first["sequence"])
                )
            if ident:
                self.cseq += 1
                tear = {"Session": ident}
                if self.challenge:
                    self.nc += 1
                    tear["Authorization"] = self.authorization("TEARDOWN", self.uri)
                self.sock.sendall(encode_request("TEARDOWN", self.uri, self.cseq, tear))
                end = time.time() + 3
                while time.time() < end:
                    self.sock.settimeout(1)
                    try:
                        kind, text, _ = self.reader.read_event()
                    except socket.timeout:
                        break
                    if kind == "rtsp":
                        print("TEARDOWN %d" % status_code(text))
                        break
            return 0 if play_code == 200 else 1
        finally:
            self.close()

    def _collect(self, seconds):
        deadline = time.time() + seconds
        limit = deadline + 5
        response = None
        packets = 0
        first = None
        while True:
            now = time.time()
            if response is not None and now >= deadline:
                break
            if now >= limit:
                break
            self.sock.settimeout(1)
            try:
                kind, a, b = self.reader.read_event()
            except socket.timeout:
                continue
            if kind == "rtsp":
                response = (a, b)
            elif kind == "media" and a % 2 == 0 and len(b) >= 12:
                info = parse_rtp(b)
                if info["version"] == 2:
                    packets += 1
                    if first is None:
                        first = info
        return response, packets, first


def expect(name, got, want):
    if got != want:
        sys.stderr.write("self-test failed: %s\n got %r\n want %r\n" % (name, got, want))
        raise SystemExit(1)


def self_test():
    got = digest_response(
        "Mufasa",
        "testrealm@host.com",
        "Circle Of Life",
        "GET",
        "/dir/index.html",
        "dcd98b7102dd2f0e8b11d0f600bfb0c093",
        qop="auth",
        nc="00000001",
        cnonce="0a4f113b",
    )
    expect("rfc2617", got, "6629fae49393a05397450978507c4ef1")

    raw = "see rtsp://admin:secret@192.168.1.64:554/Streaming/Channels/101 now"
    expect(
        "redact",
        redact(raw),
        "see rtsp://admin:***@192.168.1.64:554/Streaming/Channels/101 now",
    )
    expect("redact plain", redact("rtsp://192.168.1.64/live"), "rtsp://192.168.1.64/live")

    base = "rtsp://192.168.1.64:554/Streaming/Channels/101/"
    expect("control relative", resolve_control(base, "trackID=1"), base + "trackID=1")
    expect("control star", resolve_control(base, "*"), base)
    absolute = "rtsp://192.168.1.64:554/trackID=1"
    expect("control absolute", resolve_control(base, absolute), absolute)
    bare = "rtsp://192.168.1.64:554/Streaming/Channels/101"
    expect(
        "control parent",
        resolve_control(bare, "trackID=1"),
        "rtsp://192.168.1.64:554/Streaming/Channels/trackID=1",
    )
    expect(
        "control rooted",
        resolve_control(base, "/other"),
        "rtsp://192.168.1.64:554/other",
    )

    packet = bytes(
        [
            0x80,
            0xE0,
            0x47,
            0xF5,
            0x12,
            0x34,
            0x56,
            0x78,
            0x9A,
            0x3F,
            0x22,
            0xB1,
            0x67,
        ]
    )
    rtp = parse_rtp(packet)
    expect("rtp version", rtp["version"], 2)
    expect("rtp marker", rtp["marker"], 1)
    expect("rtp pt", rtp["payload_type"], 96)
    expect("rtp seq", rtp["sequence"], 18421)
    expect("rtp ts", rtp["timestamp"], 0x12345678)
    expect("rtp ssrc", rtp["ssrc"], 0x9A3F22B1)
    expect("rtp offset", rtp["payload_offset"], 12)

    sdp = parse_sdp(
        "\r\n".join(
            [
                "v=0",
                "o=- 0 0 IN IP4 0.0.0.0",
                "s=Media",
                "m=video 0 RTP/AVP 96",
                "a=rtpmap:96 H264/90000",
                "a=control:trackID=1",
                "m=audio 0 RTP/AVP 8",
                "a=control:trackID=2",
                "",
            ]
        )
    )
    expect("sdp medias", len(sdp["medias"]), 2)
    expect("sdp kind", sdp["medias"][0]["kind"], "video")
    expect("sdp rtpmap", sdp["medias"][0]["attributes"][0], "rtpmap:96 H264/90000")
    expect("sdp control", video_control(sdp), "trackID=1")

    expect("hikvision main", hikvision_path(1, False), "/Streaming/Channels/101")
    expect("hikvision channel 3 sub", hikvision_path(3, True), "/Streaming/Channels/302")

    ident, timeout = parse_session("9A3F22B1;timeout=60")
    expect("session id", ident, "9A3F22B1")
    expect("session timeout", timeout, 60)
    ident, timeout = parse_session("42")
    expect("session bare", ident, "42")
    expect("session missing timeout", timeout, None)
    print("self-test ok")
    return 0


def main(argv):
    parser = argparse.ArgumentParser(description="RTSP 1.0 教学客户端")
    parser.add_argument("--self-test", action="store_true", help="运行离线自测")
    parser.add_argument("--url", default="", help="只填写你有权访问的 rtsp:// 地址")
    parser.add_argument("--seconds", type=float, default=3, help="PLAY 之后读取 RTP 的秒数")
    args = parser.parse_args(argv)
    if args.self_test:
        return self_test()
    if not args.url:
        parser.print_help()
        return 2
    client = Client(args.url, 5)
    return client.run(args.seconds)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
