import type { Lesson } from "../model";

export const keepalive: Lesson = {
  id: "keepalive",
  phase: "阶段 8",
  title: "让会话在超时前活着",
  objective:
    "能从 Session 头读出 timeout，并在到期前用 GET_PARAMETER 或 OPTIONS 保住 Playing 状态。",
  minutes: 40,
  coreTopics: ["timeout 的单位是秒", "不改变状态的保活方法", "RTCP 与 RTSP 保活不是一回事"],
  practice: [
    "从 SETUP 应答里抄下 Session 和 timeout，把下一次保活的时刻写成现在加上一半时间。",
    "对 {{url}} 在 PLAY 之后只等待，不发任何 RTSP，看是不是大约在超时后断开。",
    "补上 GET_PARAMETER，确认应答仍是 200，而且 RTP 没有停。",
  ],
  acceptance: [
    "能说明保活请求必须带原来的 Session，并且 CSeq 要更新。",
    "能解释 GET_PARAMETER 和 OPTIONS 不把 Playing 打回 Ready。",
    "能判断「RTP 还在流」不等于「RTSP 超时被刷新」。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "SETUP 成功后，摄像机会为你留着一路会话。Session 头里的 timeout 告诉你：这么多秒里如果没有任何 RTSP 活动，它就可以把会话收掉。直播经常要看很久，所以客户端得在到期前主动说一句我还在。你每天有 {{daily}} 分钟，足够把一次超时看完整。",
        },
        {
          type: "terms",
          items: [
            { zh: "会话超时", en: "session timeout", text: "写在 Session 参数里，单位是秒。没写时不要假设永久，按 30 到 60 秒去保活更稳。" },
            { zh: "保活", en: "keepalive", text: "一条不打算改变播放状态的 RTSP 请求。常见是 GET_PARAMETER 或 OPTIONS，并且带 Session。" },
            { zh: "接收报告", en: "RTCP RR", text: "媒体面上的质量报告。有的设备把它也当成存活证据，但它不是 RFC 2326 里唯一的超时刷新方法。" },
          ],
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "code",
          title: "从会话头里把超时拆出来",
          code: "Session: 9A3F22B1;timeout=60",
        },
        {
          type: "p",
          text: "分号前面是不透明的会话号，timeout=60 是参数。60 秒后若没有新的 RTSP 请求，下一轮 PLAY 或保活可能得到 454 Session Not Found。保活时刻取一半，也就是 30 秒，给往返留余量。",
        },
        {
          type: "code",
          title: "空正文的 GET_PARAMETER",
          code: "GET_PARAMETER {{url}} RTSP/1.0\r\nCSeq: 6\r\nSession: 9A3F22B1\r\n\r\n",
        },
        {
          type: "code",
          title: "有的固件要求长度头，即使正文是空的",
          code: "GET_PARAMETER {{url}} RTSP/1.0\r\nCSeq: 6\r\nSession: 9A3F22B1\r\nContent-Type: text/parameters\r\nContent-Length: 0\r\n\r\n",
        },
        {
          type: "callout",
          tone: "note",
          title: "OPTIONS 也能用",
          text: "OPTIONS 同样不改变 Init、Ready、Playing。有的设备不实现 GET_PARAMETER，却接受带 Session 的 OPTIONS。以这台 {{brand}} 的真实应答为准。",
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "sequence",
          caption: "Playing 状态下每半个超时问一次",
          steps: [
            { from: "IPC", to: "客户端", title: "SETUP 200", detail: "Session: 9A3F22B1;timeout=60，进入 Ready" },
            { from: "客户端", to: "IPC", title: "PLAY", detail: "进入 Playing，RTP 开始" },
            { from: "客户端", to: "IPC", title: "30 秒时 GET_PARAMETER", detail: "带同一个 Session，CSeq 加 1" },
            { from: "IPC", to: "客户端", title: "200 OK", detail: "状态仍是 Playing，计时重新开始" },
            { from: "客户端", to: "IPC", title: "再过 30 秒再问", detail: "一直播就一直问，直到 TEARDOWN" },
          ],
        },
      ],
    },
    {
      id: "capture",
      blocks: [
        {
          type: "table",
          headers: ["你看到的", "说明"],
          rows: [
            ["rtsp.method == \"GET_PARAMETER\"", "保活是否真的发出去了"],
            ["rtsp.session == \"9A3F22B1\"", "换成你的会话号，看保活有没有带对"],
            ["两包 GET_PARAMETER 的时间差", "应明显小于 timeout，而不是刚好卡在到期之后"],
          ],
        },
        {
          type: "p",
          text: "如果 GET_PARAMETER 是 200，随后的视频序列号仍连续，保活就是成功的。若 200 之后不久 RTP 停了并且下一条命令 454，再查这台设备是不是只认 RTCP，或者会话号被写进了参数。",
        },
      ],
    },
    {
      id: "commands",
      blocks: [
        { type: "callout", tone: "warn", text: "{{urlNote}}" },
        {
          type: "code",
          title: "拉长到 70 秒，给一次 60 秒超时留出观察窗口",
          code: "ffmpeg -rtsp_transport tcp -loglevel info -i \"{{url}}\" -t 70 -f null -",
        },
        {
          type: "p",
          text: "FFmpeg 自己会发保活。你要观察的是它的客户端行为。自己的程序若只能撑到 timeout 附近就断，就还没把保活接上。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "code",
          title: "解析 timeout，并给出下一次保活的等待秒数",
          code: "def session_parts(value: str) -> tuple[str, int | None]:\n    ident, _, params = value.partition(\";\")\n    timeout = None\n    for part in params.split(\";\"):\n        item = part.strip()\n        if item.startswith(\"timeout=\"):\n            timeout = int(item.split(\"=\", 1)[1])\n    return ident.strip(), timeout\n\ndef keepalive_after(timeout: int | None) -> int:\n    if timeout is None:\n        return 30\n    return max(5, timeout // 2)\n",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "table",
          headers: ["品牌", "保活上的差别"],
          rows: [
            ["海康威视", "timeout 常见 60。GET_PARAMETER 或 OPTIONS 通常都能刷新。连接数用尽是另一件事，那是 503"],
            ["大华", "有的固件要求 GET_PARAMETER 带 Content-Length: 0。不带时返回 400，会话其实还在"],
            ["宇视", "可能不给 timeout。没写也要保活。个别固件更依赖交织通道上的 RTCP"],
          ],
        },
      ],
    },
    {
      id: "pitfalls",
      blocks: [
        {
          type: "ul",
          items: [
            "把 timeout 当成毫秒。60 毫秒会把请求打成洪水，60 秒才是这个参数的单位。",
            "保活时带上 timeout=60，把参数当成了会话号的一部分。会话号只到分号前。",
            "用 PAUSE 当保活。直播上 PAUSE 可能 455，还把状态打回 Ready。",
            "以为只要 RTP 在收，RTSP 超时就不会到。规范刷新的是 RTSP 请求，RTP 是另一条逻辑。",
            "TCP 断线后用旧 Session 继续 GET_PARAMETER。连接没了，会话也没了，要从 DESCRIBE 重新来。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "Session: 9A3F22B1;timeout=60 里，60 的单位是？",
      choices: ["毫秒", "秒", "RTP 时间戳刻度", "帧"],
      answer: 1,
      explain: "RFC 2326 的 timeout 参数单位是秒。保活放在大约 30 秒时比较稳妥。",
    },
    {
      prompt: "Playing 期间用哪一种请求保活，状态仍然是 Playing？",
      choices: ["TEARDOWN", "PAUSE", "GET_PARAMETER", "SETUP 一个新的表现地址"],
      answer: 2,
      explain: "GET_PARAMETER 和 OPTIONS 不改变状态机。PAUSE 会回到 Ready，TEARDOWN 回到 Init。",
    },
    {
      prompt: "保活得到 454。更该先检查什么？",
      choices: [
        "H.264 的 packetization-mode",
        "Session 是否还是 SETUP 给的那一串，以及距离上次成功是否已超过 timeout",
        "Marker 位",
        "m= 行的端口是不是 0",
      ],
      answer: 1,
      explain: "454 是 Session Not Found。要么没带会话号，要么带错了，要么会话已经因超时被收掉。",
    },
  ],
};

export const vendors: Lesson = {
  id: "vendors",
  phase: "阶段 9",
  title: "海康、大华、宇视的地址",
  objective:
    "能按通道和码流写出这三家常见的直播 URL，并知道回放地址不能拿来当预览。",
  minutes: 45,
  coreTopics: ["通道号从 1 计", "主码流和子码流的编号差 1", "三家的路径模板"],
  practice: [
    "不看笔记写出：海康通道 3 的子码流应该出现 302。",
    "把大华通道 1 主码流写成 /cam/realmonitor?channel=1&subtype=0。",
    "对照你自己的 {{brand}} {{model}}，说明 {{url}} 里通道和码流各是哪一段。",
  ],
  acceptance: [
    "能解释海康 101 是通道 1 乘 100 再加主码流 1。",
    "能说明大华 subtype=0 是主码流，宇视 s0 也是主码流，编号起点不同。",
    "能拒绝用回放路径去要实时预览。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "RTSP 的方法是一样的，路径是各家自己的。路径错了，鉴权还没开始就会 404。先把通道和码流从编号里读出来，再去谈 Digest 和交织。你的网络基础是 {{network}}，这一节不依赖抓包经验，但抓包能证明路径是否被摄像机接受。",
        },
        {
          type: "table",
          caption: "三家直播路径",
          headers: ["品牌", "模板", "通道 1 主码流", "通道 3 子码流"],
          rows: [
            ["海康威视", "/Streaming/Channels/{通道*100+码流}", "/Streaming/Channels/101", "/Streaming/Channels/302"],
            ["大华", "/cam/realmonitor?channel={通道}&subtype={码流}", "channel=1&subtype=0", "channel=3&subtype=1"],
            ["宇视", "/unicast/c{通道}/s{码流}/live", "/unicast/c1/s0/live", "/unicast/c3/s1/live"],
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "编号起点不一样",
          text: "海康的码流从 1 开始：1 主码流，2 子码流，3 第三码流。大华的 subtype 和宇视的 s 从 0 开始：0 是主码流，1 是子码流。通道号三家都从 1 开始。",
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "p",
          text: "海康把两位数塞进一个整数。通道 3、子码流 2，就是 3*100+2=302。所以 /Streaming/Channels/302 不是第三百零二号通道，而是通道 3 的子码流。",
        },
        {
          type: "code",
          title: "海康：通道与码流合成最后一段",
          code: "def hikvision_path(channel: int, sub: bool) -> str:\n    stream = 2 if sub else 1\n    return \"/Streaming/Channels/%d\" % (channel * 100 + stream)\n",
        },
        {
          type: "code",
          title: "大华和宇视是两个独立参数",
          code: "def dahua_path(channel: int, sub: bool) -> str:\n    subtype = 1 if sub else 0\n    return \"/cam/realmonitor?channel=%d&subtype=%d\" % (channel, subtype)\n\ndef uniview_path(channel: int, sub: bool) -> str:\n    stream = 1 if sub else 0\n    return \"/unicast/c%d/s%d/live\" % (channel, stream)\n",
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "p",
          text: "下面三条都是通道 1 的主码流，端口按默认 554。你登记的设备是 {{brand}} {{model}}。若你留了真实地址，课程里的 {{url}} 会换成它；否则仍用教学示例。{{urlNote}}",
        },
        {
          type: "code",
          title: "海康威视",
          code: "rtsp://user:pass@192.168.1.64:554/Streaming/Channels/101",
        },
        {
          type: "code",
          title: "大华",
          code: "rtsp://user:pass@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0",
        },
        {
          type: "code",
          title: "宇视",
          code: "rtsp://user:pass@192.168.1.88:554/unicast/c1/s0/live",
        },
        {
          type: "callout",
          tone: "note",
          title: "老路径还在一些固件里",
          text: "海康旧写法 /h264/ch1/main/av_stream 仍可能通。它和 /Streaming/Channels/101 指向同一类主码流，但是不同的 URL。新客户端先用 Channels 这一套，旧地址留作 404 之后的对照。",
        },
      ],
    },
    {
      id: "capture",
      blocks: [
        {
          type: "ol",
          items: [
            "过滤 rtsp.method == \"DESCRIBE\"，看请求行里的路径是不是你打算打开的那一路。",
            "404 时把路径数字圈出来：海康看末三位，大华看 channel 和 subtype，宇视看 c 和 s。",
            "200 之后再看 SDP 里有几路 m=。有的子码流只有视频，没有音频，这不是失败。",
          ],
        },
      ],
    },
    {
      id: "commands",
      blocks: [
        { type: "callout", tone: "warn", text: "{{urlNote}}" },
        {
          type: "code",
          title: "只探测，不保存画面",
          code: "ffprobe -rtsp_transport tcp -hide_banner \"{{url}}\"",
        },
        {
          type: "p",
          text: "在 {{os}} 上如果 ffprobe 不在 PATH 里，先按路线开头的安装提示补上，再来对 {{host}} 做这一次探测。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "p",
          text: "写平台接入时不要把三家路径拼进一个不加品牌的函数。先分支，再调用。通道小于 1 直接拒绝，避免算出 001 或 channel=0 这种摄像机不存在的地址。",
        },
        {
          type: "code",
          title: "按品牌选择直播路径",
          code: "def live_path(brand: str, channel: int, sub: bool) -> str:\n    if channel < 1:\n        raise ValueError(\"通道从 1 开始\")\n    if brand == \"hikvision\":\n        return hikvision_path(channel, sub)\n    if brand == \"dahua\":\n        return dahua_path(channel, sub)\n    if brand == \"uniview\":\n        return uniview_path(channel, sub)\n    raise ValueError(\"未知品牌，先用 ONVIF 要 URI\")\n",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "table",
          headers: ["场景", "不要用的地址"],
          rows: [
            ["海康回放", "/Streaming/tracks/101?starttime=... 是录像，不是实时预览"],
            ["大华回放", "带 starttime 的 playback 路径。实时预览用 realmonitor"],
            ["宇视回放", "录像回放常常是另一条 media 路径。直播先试 /unicast/c1/s0/live"],
            ["NVR 通道", "NVR 上的通道号是 NVR 自己的顺序，不一定等于 IPC 拨码或网页里的通道 1"],
          ],
        },
        {
          type: "p",
          text: "其他品牌和未知型号不要猜路径。ONVIF GetStreamUri 或网页上的 RTSP 提示比记忆口诀可靠。猜三次都 404，就停下来看说明书，而不是继续改密码。",
        },
      ],
    },
    {
      id: "pitfalls",
      blocks: [
        {
          type: "ul",
          items: [
            "把海康子码流写成 301。通道 3 的主码流才是 301，子码流是 302。",
            "大华主码流写成 subtype=1。1 是子码流，主码流是 0。",
            "宇视写成 s1 却以为那是主码流。s0 才是主码流。",
            "在查询参数后面再加一个斜杠，大华会把 channel 解析丢。",
            "用国标 20 位编码替换通道号。GB28181 的设备号不是这三条路径的参数。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "海康威视通道 3、子码流，路径最后一段是？",
      choices: ["103", "301", "302", "203"],
      answer: 2,
      explain: "通道乘 100 再加码流。子码流是 2，所以 3*100+2=302，路径 /Streaming/Channels/302。",
    },
    {
      prompt: "大华通道 1 的主码流，哪一条是对的？",
      choices: [
        "/cam/realmonitor?channel=1&subtype=0",
        "/cam/realmonitor?channel=0&subtype=1",
        "/Streaming/Channels/101",
        "/unicast/c1/s0/live",
      ],
      answer: 0,
      explain: "大华实时预览用 realmonitor。channel 从 1 起，subtype 0 是主码流。另两条分别是海康和宇视。",
    },
    {
      prompt: "宇视通道 1 主码流的常见直播路径是？",
      choices: [
        "/unicast/c0/s1/live",
        "/unicast/c1/s0/live",
        "/cam/realmonitor?channel=1&subtype=0",
        "/Streaming/Channels/110",
      ],
      answer: 1,
      explain: "c 后面是通道，从 1 起；s 后面是码流，0 是主码流。所以是 /unicast/c1/s0/live。",
    },
  ],
};

export const wireshark: Lesson = {
  id: "wireshark",
  phase: "阶段 10",
  title: "用 Wireshark 把一次播放看完",
  objective:
    "能选对网卡，用显示过滤器分开 RTSP、RTP 和失败码，并把 TCP 交织里的 RTP 解出来。",
  minutes: 50,
  coreTopics: ["显示过滤器和捕获过滤器", "Follow TCP Stream", "从 RTSP 中解出 RTP"],
  practice: [
    "只抓 {{host}}，过滤器从 ip.addr == {{host}} 开始，再收窄到 tcp.port == 554。",
    "对一次完整播放执行 Follow → TCP Stream，标出 DESCRIBE、SETUP、PLAY 和后面的乱码。",
    "打开 RTP over RTSP 的解码，让交织的视频出现在 Telephony 的 RTP Streams 里。",
  ],
  acceptance: [
    "能说出显示过滤器 rtsp 和捕获过滤器 tcp port 554 不是同一种语法。",
    "能用 rtsp.status >= 400 把失败从成功握手里挑出来。",
    "能解释 Follow TCP Stream 里的乱码多半是交织 RTP，不是加密。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "Wireshark 把网卡上的帧解开。RTSP 是文本，适合先看对话；RTP 是二进制，适合看序列号和时间戳。你的目标是 {{goal}}。抓包是排障和写客户端共用的证据，不是最后才用的手段。",
        },
        {
          type: "terms",
          items: [
            { zh: "捕获过滤器", en: "capture filter", text: "开始抓之前就丢掉不要的帧，语法接近 tcpdump，例如 tcp port 554。丢了就补不回来。" },
            { zh: "显示过滤器", en: "display filter", text: "抓完再筛选，语法是 Wireshark 自己的，例如 rtsp.method == \"PLAY\"。可以反复改。" },
            { zh: "跟踪流", en: "Follow TCP Stream", text: "把同一条连接的载荷按顺序拼起来。客户端和摄像机用两种颜色分开。" },
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "先少抓",
          text: "第一次只抓和 {{host}} 的对话。网卡选你真正用来访问摄像机的那块。抓「任意」或一块没接线的适配器，过滤器写对了也是空的。",
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "table",
          caption: "显示过滤器，按这个顺序加",
          headers: ["表达式", "留下"],
          rows: [
            ["ip.addr == {{host}}", "只和这台摄像机有关的包"],
            ["tcp.port == 554", "RTSP 默认端口上的 TCP"],
            ["rtsp", "已经被认出是 RTSP 的包"],
            ["rtsp.method == \"SETUP\"", "选传输的请求"],
            ["rtsp.status == 401", "鉴权挑战"],
            ["rtsp.status >= 400", "所有失败应答"],
            ["rtp", "已经解出的 RTP"],
            ["rtp.marker == 1", "帧的最后一个 RTP 包"],
            ["rtcp", "质量报告"],
          ],
        },
        {
          type: "p",
          text: "捕获过滤器如果要写，用 host {{host}} and tcp port 554。注意这里没有双等号，也没有 rtsp.method 这种字段。那是显示过滤器才有的。",
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "packets",
          caption: "一次带鉴权的 TCP 播放，点开每一行看该停在哪。",
          rows: [
            {
              no: "1",
              time: "0.000",
              src: "客户端",
              dst: "{{host}}:554",
              proto: "TCP",
              info: "SYN",
              detail: "三次握手的开始。若后面没有 SYN-ACK，停在网络层，不要分析 RTSP 方法。",
            },
            {
              no: "6",
              time: "0.040",
              src: "客户端",
              dst: "{{host}}:554",
              proto: "RTSP",
              info: "DESCRIBE",
              detail: "第一条真正的 RTSP。Accept 里应有 application/sdp。此时还没有 Session。",
            },
            {
              no: "7",
              time: "0.048",
              src: "{{host}}:554",
              dst: "客户端",
              proto: "RTSP",
              info: "401 Unauthorized",
              detail: "看 WWW-Authenticate 是不是 Digest。这是挑战，不是结束。下一条应该是带 Authorization 的 DESCRIBE。",
            },
            {
              no: "12",
              time: "0.090",
              src: "{{host}}:554",
              dst: "客户端",
              proto: "RTSP",
              info: "200 OK application/sdp",
              detail: "正文从 v=0 开始。记下 Content-Base。SDP 不是独立的 UDP 流。",
            },
            {
              no: "18",
              time: "0.140",
              src: "客户端",
              dst: "{{host}}:554",
              proto: "RTSP",
              info: "SETUP interleaved=0-1",
              detail: "Transport 决定了后面会在这条 TCP 里看到 0x24。应答里要有 Session。",
            },
            {
              no: "24",
              time: "0.210",
              src: "{{host}}:554",
              dst: "客户端",
              proto: "RTP",
              info: "PT=96 Seq=18421 Marker",
              detail: "只有打开 RTP over RTSP 解码后，这一行才会显示成 RTP。否则它埋在 TCP 载荷里，Follow Stream 只看到乱码。",
            },
          ],
        },
      ],
    },
    {
      id: "capture",
      blocks: [
        {
          type: "ol",
          items: [
            "编辑 → 首选项 → Protocols → RTSP，勾选 Try to decode RTP over RTSP，重新打开抓包。",
            "右键这条 TCP，选 Decode As，端口 554 对应 RTSP。非 554 的设备必须做这一步，否则方法名不会被识别。",
            "Telephony → RTP → RTP Streams，看丢包、抖动和载荷类型。载荷类型要和 SDP 的 rtpmap 一致。",
            "需要存档时导出显示过滤后的包。导出前把含真实用户名的抓包留在自己的磁盘上。",
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "乱码不等于 SRTP",
          text: "交织的 H.264 在文本窗口里就是高位字节。SRTP 要在 SDP 或 Transport 里看到 RTP/SAVP，不能只凭乱码判断。",
        },
      ],
    },
    {
      id: "commands",
      blocks: [
        { type: "callout", tone: "warn", text: "{{urlNote}}" },
        {
          type: "p",
          text: "在 {{os}} 上若没有图形界面，可以用 tshark 做同一套显示过滤器。dumpcap 或 tcpdump 只负责捕获。",
        },
        {
          type: "code",
          title: "命令行复述一次播放",
          code: "tshark -i 1 -Y \"ip.addr == {{host}} && rtsp\" -T fields -e frame.number -e rtsp.request.method -e rtsp.status.code",
        },
        {
          type: "p",
          text: "-i 后面的网卡编号先用 tshark -D 看。-Y 是显示过滤器。捕获过滤器用 -f，语法不同，不要混用。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "p",
          text: "过滤表达式可以先在你的 {{lang}} 笔记里做成一张表，抓的时候复制，避免把 == 写成 =。",
        },
        {
          type: "code",
          title: "按问题选择过滤器",
          code: "FILTERS = {\n    \"对话\": \"rtsp\",\n    \"失败\": \"rtsp.status >= 400\",\n    \"视频\": \"rtp && rtp.p_type == 96\",\n    \"帧尾\": \"rtp.marker == 1\",\n}\n",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "ul",
          items: [
            "海康、大华、宇视的默认端口都可能被改掉。过滤器用 tcp.port == 554 之前，先在网页里确认端口，或者先只滤 IP。",
            "NVR 转出的流，IP 是 NVR 不是 IPC。ip.addr 写成摄像机，会什么都抓不到。",
            "有的设备把 RTSP 放在 8554 或 10554。Decode As 要跟着改。",
          ],
        },
      ],
    },
    {
      id: "pitfalls",
      blocks: [
        {
          type: "ul",
          items: [
            "在捕获过滤器里写 rtsp。捕获过滤器不认识这个字段，抓取会直接失败或什么都不留。",
            "Follow TCP Stream 看到乱码就判断为加密。先找 0x24 和 PLAY 的时间关系。",
            "没开 RTP over RTSP，就说摄像机没有发 RTP。RTP 还在 TCP 载荷里。",
            "抓包抓到了管理电脑和摄像机的 HTTP，却忘了播放器在另一台机器上。要抓播放器所在的那一侧，或者做端口镜像。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "想在已经抓完的包里只看 PLAY，应该用哪种？",
      choices: [
        "捕获过滤器 tcp port 554",
        "显示过滤器 rtsp.method == \"PLAY\"",
        "显示过滤器 tcp port 554",
        "捕获过滤器 rtsp.method == PLAY",
      ],
      answer: 1,
      explain: "方法名是显示过滤器的字段。捕获过滤器用 host 和 port 这种语法，不能写 rtsp.method。",
    },
    {
      prompt: "PLAY 之后 Follow TCP Stream 全是乱码。首先怀疑什么？",
      choices: [
        "一定是 SRTP",
        "TCP 交织的 RTP 混进了文本流，需要按 0x24 帧或打开 RTP over RTSP",
        "密码错误",
        "SDP 版本不是 0",
      ],
      answer: 1,
      explain: "交织模式故意把二进制 RTP 放进同一条 TCP。密码错误是 401，而且发生在有 RTP 之前。",
    },
    {
      prompt: "ip.addr == {{host}} 一个包都没有。哪一项最该先做？",
      choices: [
        "修改 H.264 的 profile-level-id",
        "确认网卡、IP 和播放器是不是在你抓的这台机器上",
        "把 Marker 位清掉",
        "发送 ANNOUNCE",
      ],
      answer: 1,
      explain: "没有任何 IP 包时，还到不了编码参数。先确认抓对了网卡、写对了地址，并且流量确实经过这块网卡。",
    },
  ],
};

export const tools: Lesson = {
  id: "tools",
  phase: "阶段 11",
  title: "FFmpeg、VLC、GStreamer 和 OpenCV",
  objective:
    "能用这四样工具以 TCP 打开 {{url}}，并知道它们各自适合核对握手、看画面、接管道还是读一帧。",
  minutes: 45,
  coreTopics: ["ffprobe 与 ffmpeg 的分工", "VLC 的 TCP 开关", "GStreamer 管道和 OpenCV 的环境变量"],
  practice: [
    "用 ffprobe 看 {{url}} 有几路流，不要先保存文件。",
    "用 VLC 打开同一地址，强制 RTSP over TCP。",
    "用 GStreamer 或 OpenCV 读到一帧。读不到时把报错原文留下来，下一课对状态码。",
  ],
  acceptance: [
    "能说出 -rtsp_transport tcp 是给 FFmpeg 的，不是写进 URL 的路径。",
    "能写出一条只拉 3 秒并不重新编码的 ffmpeg 命令。",
    "能说明 OpenCV 的 TCP 选项要在创建 VideoCapture 之前设置。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "这四个工具都是客户端。它们替你做 OPTIONS 到 PLAY，再处理 RTP。你用它们是为了得到一份对照：成熟客户端能播，问题就缩到你的 URL、账号或网络；成熟客户端也不能播，再抓包看摄像机怎么拒绝。",
        },
        {
          type: "table",
          headers: ["工具", "这一课用它做什么", "不要用它做什么"],
          rows: [
            ["ffprobe", "看有没有视频流、编码和分辨率", "长时间预览"],
            ["ffmpeg", "短时间拉流、转封装、把握手打到日志", "当成摄像机的管理界面"],
            ["VLC", "立刻看画面，确认人眼能认出的图像", "解析 FU-A 的字节"],
            ["GStreamer", "把解包和解码拆成可以替换的管道", "记忆一长串不写协议名的简写"],
            ["OpenCV", "在程序里拿到一帧 BGR 图像", "替代 RTSP 抓包"],
          ],
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "p",
          text: "工具的参数不是 RTSP 头。-rtsp_transport tcp 会让它在 SETUP 里写 RTP/AVP/TCP;unicast;interleaved=0-1。你在日志里应能看到这条 Transport，而不是在 URL 末尾加上 ?tcp=1。",
        },
        {
          type: "ul",
          items: [
            "FFmpeg 日志里的 method DESCRIBE、status 200，对应你在协议课里学的应答行。",
            "VLC 的消息窗口同样打印 RTSP 对话。打开工具 → 消息，把详细程度调到 2。",
            "GStreamer 的 rtspsrc 会发同样的五步。protocols=tcp 选择交织。",
            "OpenCV 默认调用 FFmpeg 后端，所以环境变量用的是 FFmpeg 的选项名。",
          ],
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "p",
          text: "示例都针对 {{url}}。{{urlNote}} 在 {{os}} 上先确认命令能在终端里找到。每天 {{daily}} 分钟的话，这一节把四条命令各跑通一次就够。",
        },
        {
          type: "code",
          title: "FFmpeg：TCP，拉 3 秒，不转码，不要音频",
          code: "ffmpeg -rtsp_transport tcp -i \"{{url}}\" -t 3 -c copy -an out.mp4",
        },
        {
          type: "code",
          title: "VLC：强制 RTSP over TCP",
          code: "vlc --rtsp-tcp \"{{url}}\"",
        },
        {
          type: "code",
          title: "GStreamer：解包 H.264 并显示",
          code: "gst-launch-1.0 rtspsrc location=\"{{url}}\" protocols=tcp latency=200 ! rtph264depay ! h264parse ! avdec_h264 ! autovideosink",
        },
      ],
    },
    {
      id: "capture",
      blocks: [
        {
          type: "p",
          text: "工具播放时同时开着 Wireshark，过滤器 rtsp && ip.addr == {{host}}。你应该看到和手写客户端一样的 DESCRIBE、SETUP、PLAY。若工具用了 UDP，SETUP 的 Transport 里会出现 client_port，而不是 interleaved。",
        },
        {
          type: "callout",
          tone: "tip",
          text: "对照时固定一种传输。一会儿 TCP 一会儿 UDP，会把 461 和防火墙问题叠在一起。",
        },
      ],
    },
    {
      id: "commands",
      blocks: [
        { type: "callout", tone: "warn", text: "{{urlNote}}" },
        {
          type: "code",
          title: "ffprobe 只打印流",
          code: "ffprobe -rtsp_transport tcp -hide_banner -show_streams \"{{url}}\"",
        },
        {
          type: "p",
          text: "GStreamer 若报 no element rtspsrc，说明插件包没装全。Debian 上需要 gstreamer1.0-plugins-good 和 bad，而不是只装 tools。H.265 时把 rtph264depay 换成 rtph265depay，解码器换成 avdec_h265。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "code",
          title: "OpenCV 读一帧。环境变量要写在 import cv2 之前",
          code: "import os\nos.environ[\"OPENCV_FFMPEG_CAPTURE_OPTIONS\"] = \"rtsp_transport;tcp\"\nimport cv2\n\ncap = cv2.VideoCapture(\"{{url}}\", cv2.CAP_FFMPEG)\nok, frame = cap.read()\ncap.release()\nif not ok:\n    raise SystemExit(\"没有读到帧\")\nprint(frame.shape)\n",
        },
        {
          type: "p",
          text: "选项用分号分成名字和值，这是 OpenCV 传给 FFmpeg 的写法，不是 RTSP 的头部。读不到帧时，先用 ffmpeg 命令行对同一 URL，不要先改阈值或分辨率。",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "ul",
          items: [
            "海康、大华、宇视都接受上面的 TCP 参数。差别在 URL，不在把 ffmpeg 换成某一家专用播放器。",
            "有的摄像机限制同时拉流的客户端数量。VLC 没关又开 ffprobe，会得到 503。测完就停。",
            "子码流分辨率低，适合 OpenCV 试验；主码流适合确认清晰度。不要用主码流的超时去否定子码流的路径。",
          ],
        },
      ],
    },
    {
      id: "pitfalls",
      blocks: [
        {
          type: "ul",
          items: [
            "把密码留在 shell 历史里。命令跑通后清理历史，笔记里只留红掉口令的地址。",
            "OpenCV 先 import 再设环境变量。FFmpeg 后端可能已经读过空的选项。",
            "GStreamer 管道用 rtph264depay 去解 H.265，报 not-negotiated。先看 ffprobe 的 codec_name。",
            "latency 调到 0 就认为越低越好。摄像机抖动会让画面更碎，200 毫秒是合理的起点。",
            "-c copy 写成了默认转码，把协议问题误判成编码器不支持。核对握手时尽量 copy。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "希望 FFmpeg 用 TCP 交织，参数写在哪？",
      choices: [
        "URL 末尾 ?transport=tcp",
        "命令行 -rtsp_transport tcp",
        "SDP 的 c= 行",
        "只有 VLC 能用 TCP",
      ],
      answer: 1,
      explain: "-rtsp_transport tcp 让 FFmpeg 在 SETUP 里请求 interleaved。它不是 URL 的一部分，也不改 SDP。",
    },
    {
      prompt: "OpenCV 强制 TCP 时，环境变量应该何时设置？",
      choices: [
        "read() 返回之后",
        "import cv2 之前",
        "只在 Windows 上需要，而且写进 URL",
        "设置与否不影响，因为 OpenCV 不用 FFmpeg",
      ],
      answer: 1,
      explain: "OPENCV_FFMPEG_CAPTURE_OPTIONS 要在后端初始化前就位。值是 rtsp_transport;tcp，分号分开名字和值。",
    },
    {
      prompt: "GStreamer 播放 H.264 时，RTP 解包元件是？",
      choices: ["rtph264depay", "h264parse", "avdec_h264", "autovideosink"],
      answer: 0,
      explain: "rtph264depay 把 RTP 载荷还原成 H.264 访问单元。h264parse 整理流，avdec_h264 解码，autovideosink 显示。",
    },
  ],
};
