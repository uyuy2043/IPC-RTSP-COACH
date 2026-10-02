import type { Lesson } from "../model";

export const pythonClient: Lesson = {
  id: "python",
  phase: "阶段 12",
  title: "用 Python 走完一次播放",
  objective:
    "能按 OPTIONS、DESCRIBE、SETUP、PLAY、读 RTP、TEARDOWN 的顺序写出最小客户端，并让摘要算法通过公开测试向量。",
  minutes: 70,
  coreTopics: ["一条 TCP 上的文本应答", "Digest 与控制地址", "交织帧里的 RTP"],
  practice: [
    "先跑 python3 lab/rtsp_miniclient.py --self-test，确认摘要、红密码、控制地址、RTP、SDP、海康 302 和 timeout 都通过。",
    "读 lab/rtsp_miniclient.py 的现场模式，在纸上标出 CSeq 在哪增加。",
    "只有在你拥有 {{host}} 时，才用 --url 去连 {{url}}。连不上就停，不要换别人的地址试。",
  ],
  acceptance: [
    "能说明请求行使用去掉用户信息的绝对 URI。",
    "能指出 PLAY 之后不能再把套接字当纯文本读。",
    "能让 RFC 2617 的 response 等于 6629fae49393a05397450978507c4ef1。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "最小客户端只做直播需要的那几步：连上 TCP，问能力，拿 SDP，用 TCP 交织 SETUP 视频，PLAY，读若干 RTP，再 TEARDOWN。你熟悉的语言是 {{lang}}。练习用 Python，是因为字节和字符串对照起来短；迁到别的语言时，顺序不要变。",
        },
        {
          type: "ol",
          items: [
            "解析 URL，把用户名和密码从请求行里拿掉。请求行只留 rtsp://主机:端口/路径。",
            "OPTIONS 和 DESCRIBE。若 401，按 Digest 重发，CSeq 加 1。",
            "解析 SDP，用 Content-Base 解析视频的 a=control。",
            "SETUP 这一路，Transport 固定为 RTP/AVP/TCP;unicast;interleaved=0-1。",
            "PLAY 表现地址，Range 用 npt=0.000- 。",
            "按 0x24 帧读取 RTP，再 TEARDOWN。",
          ],
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "walk",
          caption: "现场模式发出的五条。鉴权省略时长这样；有 401 就在对应步骤重发。",
          steps: [
            {
              name: "OPTIONS",
              send: "OPTIONS {{url}} RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: rtsp-coach\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 1\r\nPublic: OPTIONS, DESCRIBE, SETUP, TEARDOWN, PLAY, GET_PARAMETER\r\n\r\n",
              why: "确认对端是 RTSP。Public 只作参考。",
            },
            {
              name: "DESCRIBE",
              send: "DESCRIBE {{url}} RTSP/1.0\r\nCSeq: 2\r\nAccept: application/sdp\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 2\r\nContent-Type: application/sdp\r\nContent-Base: {{url}}/\r\nContent-Length: <字节数>\r\n\r\n",
              why: "按 Content-Length 把 SDP 读完。不要读到下一个请求才停。",
            },
            {
              name: "SETUP",
              send: "SETUP <resolve_control 的结果> RTSP/1.0\r\nCSeq: 3\r\nTransport: RTP/AVP/TCP;unicast;interleaved=0-1\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 3\r\nSession: 9A3F22B1;timeout=60\r\nTransport: RTP/AVP/TCP;unicast;interleaved=0-1\r\n\r\n",
              why: "保存分号前的会话号。timeout 用来决定以后的保活，这一次短读可以不发 GET_PARAMETER。",
            },
            {
              name: "PLAY",
              send: "PLAY {{url}} RTSP/1.0\r\nCSeq: 4\r\nSession: 9A3F22B1\r\nRange: npt=0.000-\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 4\r\nRTP-Info: url=<track>;seq=18421;rtptime=305419896\r\n\r\n",
              why: "从这一刻起套接字里会混进 0x24 帧。先把这条 200 读完，再进入二进制循环。",
            },
            {
              name: "TEARDOWN",
              send: "TEARDOWN {{url}} RTSP/1.0\r\nCSeq: 5\r\nSession: 9A3F22B1\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 5\r\n\r\n",
              why: "读过你想看的 RTP 就拆会话。直接关 TCP 也能停，但会占着摄像机的连接数。",
            },
          ],
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "p",
          text: "仓库里的 lab/rtsp_miniclient.py 就是这个顺序的教学实现。自测不联网。现场模式只应该指向你有权访问的摄像机，例如你留下的 {{host}}。",
        },
        {
          type: "code",
          title: "自测和现场模式",
          code: "python3 lab/rtsp_miniclient.py --self-test\npython3 lab/rtsp_miniclient.py --url \"{{url}}\" --seconds 3",
        },
        {
          type: "callout",
          tone: "warn",
          text: "{{urlNote}} 程序打印地址时会把口令红成 ***。不要再额外 print 密码或 Authorization。",
        },
      ],
    },
    {
      id: "capture",
      blocks: [
        {
          type: "p",
          text: "跑现场模式时抓 {{host}}。包的数量应和程序打印的 RTP 数接近。若 Wireshark 里有 PLAY 200 而程序说没读到 RTP，多半是把 0x24 帧头算进了 RTP，版本号对不上，包被丢掉了。",
        },
        {
          type: "ul",
          items: [
            "CSeq 在请求和应答里成对出现。",
            "SETUP 的 URI 含 track，PLAY 的 URI 是表现地址。",
            "TEARDOWN 之后不应再有成片的 RTP。若还有，说明拆的不是刚才那个 Session。",
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
          title: "和 FFmpeg 对照同一条地址",
          code: "ffmpeg -rtsp_transport tcp -loglevel debug -i \"{{url}}\" -t 3 -f null -",
        },
        {
          type: "p",
          text: "两边都 200，才把时间花在解析 RTP。只有一边成功时，先比 Transport 和 Authorization，不要先改帧率。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "code",
          title: "读应答：先找空行，再按 Content-Length 取正文",
          code: "def read_response(sock):\n    buf = b\"\"\n    while b\"\\r\\n\\r\\n\" not in buf:\n        chunk = sock.recv(4096)\n        if not chunk:\n            raise ConnectionError(\"对端在头部结束前关闭\")\n        buf += chunk\n    head, rest = buf.split(b\"\\r\\n\\r\\n\", 1)\n    text = head.decode(\"utf-8\", \"replace\")\n    length = 0\n    for line in text.split(\"\\r\\n\")[1:]:\n        name, _, value = line.partition(\":\")\n        if name.lower() == \"content-length\":\n            length = int(value.strip())\n    while len(rest) < length:\n        rest += sock.recv(length - len(rest))\n    body, leftover = rest[:length], rest[length:]\n    return text, body, leftover\n",
        },
        {
          type: "p",
          text: "leftover 要放回缓冲区。PLAY 的 RTP 可能和应答粘在同一次 recv 里。丢弃 leftover 会把第一个 0x24 弄丢。自测里的 parse_rtp 只接受真正的 RTP，版本不是 2 就说明帧头还在。",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "ul",
          items: [
            "海康通道 3 子码流用 hikvision_path(3, sub=True)，结果是 /Streaming/Channels/302。自测锁的就是这个数。",
            "大华路径带查询参数。Digest 的 uri 必须包含 ?channel=1&subtype=0 这一整段，不能只哈希路径。",
            "宇视 /unicast/c1/s0/live 的 control 不一定叫 trackID。用 SDP 里的原文，不要在 Python 里写死。",
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
            "用 str 发送却忘了编码，或行尾只写 \\n。RTSP 要的是 CRLF 的字节。",
            "在 f 字符串表达式里塞反斜杠。教学代码用拼接或百分号格式，避免旧版本 Python 的语法限制。",
            "401 重试时复用同一个 CSeq。那会被当成重传，而不是新的带鉴权请求。",
            "PLAY 之后继续按行 readline。二进制里的字节会把文本解码打乱。",
            "自测没过就去连摄像机。向量、路径和 RTP 头都是离线可以证明的。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "请求行里的 URI 应该怎么处理用户名和密码？",
      choices: [
        "写进 rtsp://user:pass@主机/路径，否则 Digest 无法计算",
        "从请求行去掉，口令只参与 Digest，日志里红掉",
        "放到 CSeq 后面当一个数字",
        "写进 Session 头",
      ],
      answer: 1,
      explain: "请求 URI 是 rtsp://主机/路径。用户名和 realm、密码一起算 HA1。打印时把 user:pass@ 换成 user:***@。",
    },
    {
      prompt: "PLAY 返回之后，下一次从套接字读到的第一个字节可能是？",
      choices: ["一定是 R，因为还是文本", "0x24，表示交织帧开始", "SDP 的 v", "空格"],
      answer: 1,
      explain: "交织模式下 RTP 和后续的 RTSP 应答共享这条 TCP。0x24 开头要按通道和长度切，其余才可能是 RTSP/1.0。",
    },
    {
      prompt: "RFC 2617 测试向量在 qop=auth 时的 response 是？",
      choices: [
        "6629fae49393a05397450978507c4ef1",
        "5ccc069c403ebaf9f0171e9517f40e41",
        "dcd98b7102dd2f0e8b11d0f600bfb0c093",
        "0a4f113b",
      ],
      answer: 0,
      explain: "第一项是 response。第二项在那份例子里是 opaque，第三项是 nonce，第四项是 cnonce。自测对的是 response。",
    },
  ],
};

export const trouble: Lesson = {
  id: "trouble",
  phase: "阶段 13",
  title: "按状态码收窄故障",
  objective:
    "见到 401、404、454、455、457、461、503 时，能说出下一件该查的事，而不是同时改密码、路径和传输。",
  minutes: 45,
  coreTopics: ["每个状态码只指向一个面", "超时和拒绝不是同一种失败", "一次只改一个条件"],
  practice: [
    "拿一份失败日志，先标出最后一条请求的方法和状态码。",
    "对 {{url}} 故意改错路径，确认你得到的是 404 而不是 401。",
    "把下面的决策表抄到自己的笔记，用 {{brand}} 的一次真实失败填一行。",
  ],
  acceptance: [
    "能把这七个状态码分别对应到鉴权、路径、会话、状态、范围、传输和繁忙。",
    "能说明 TCP 超时没有状态码。",
    "能在改下一处之前保留上一处的原文。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "排障是缩小范围。RTSP 的状态码已经帮你分过类。一次改密码、换路径、再改 TCP，会让你不知道是哪一下好的。你的目标是 {{goal}}，这一节把前面的状态机用成一张表。",
        },
        {
          type: "table",
          caption: "先认失败属于哪一类",
          headers: ["你观察到的", "还没进入的层"],
          rows: [
            ["TCP 连接超时，没有任何 RTSP 文本", "不要分析 Digest 或 SDP"],
            ["有 RTSP 状态码", "网络至少通到了 554 或你填的端口"],
            ["200 的 PLAY 但没有 RTP", "看 Transport，不要回头改 URL 拼写"],
          ],
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "table",
          caption: "七个要能脱口而出的码",
          headers: ["码", "原因短语", "下一件只查这一件"],
          rows: [
            ["401", "Unauthorized", "realm、nonce、uri 是否与请求行一致，stale 是否为真，账号有没有预览权限"],
            ["404", "Not Found", "路径。海康末段、大华 channel 与 subtype、宇视 c 与 s，回放路径不要当直播"],
            ["454", "Session Not Found", "Session 原文，以及距离上次成功是否超过 timeout"],
            ["455", "Method Not Valid in This State", "方法顺序。没 SETUP 就 PLAY，或对直播 PAUSE"],
            ["457", "Invalid Range", "Range。直播用 npt=0.000- ，不要把回放的 clock 写到预览 URL 上"],
            ["461", "Unsupported Transport", "Transport。改 UDP 或 TCP 交织，看设备有没有关掉其中一种"],
            ["503", "Service Unavailable", "连接数、主码流路数、是不是还有没 TEARDOWN 的客户端"],
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "旁边这几个也别认错",
          text: "405 是方法名字不被允许，551 是 Require 的扩展不认识，400 常常是头部缺空行或 Content-Length 不对。它们都不是 401。",
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "sequence",
          caption: "一次 404 不该演化成改密码",
          steps: [
            { from: "客户端", to: "IPC", title: "DESCRIBE 错误路径", detail: "例如把海康 302 写成了 301，还以为子码流是主码流那个数" },
            { from: "IPC", to: "客户端", title: "404 Not Found", detail: "停。路径问题已经定性" },
            { from: "客户端", to: "笔记", title: "只改最后一段", detail: "改成 /Streaming/Channels/302 再 DESCRIBE 一次" },
            { from: "IPC", to: "客户端", title: "401 或 200", detail: "这时才进入鉴权或 SDP。不要在 404 的同一轮里更换口令" },
          ],
        },
        {
          type: "p",
          text: "对 {{brand}} {{model}} 也一样。{{urlNote}}",
        },
      ],
    },
    {
      id: "capture",
      blocks: [
        {
          type: "table",
          headers: ["过滤表达式", "专门看"],
          rows: [
            ["rtsp.status == 401", "鉴权"],
            ["rtsp.status == 404", "路径"],
            ["rtsp.status == 454", "会话"],
            ["rtsp.status == 455 || rtsp.status == 457", "状态或范围"],
            ["rtsp.status == 461", "传输"],
            ["rtsp.status == 503", "服务忙"],
          ],
        },
        {
          type: "p",
          text: "点开失败应答的前一条请求，只记录方法、URI 和那个状态码。CSeq 对得上，才说明你看的是同一轮。",
        },
      ],
    },
    {
      id: "commands",
      blocks: [
        { type: "callout", tone: "warn", text: "{{urlNote}}" },
        {
          type: "code",
          title: "把 FFmpeg 的方法名和状态留在终端",
          code: "ffmpeg -rtsp_transport tcp -loglevel debug -i \"{{url}}\" -t 3 -f null -",
        },
        {
          type: "p",
          text: "在输出里搜索 401、404、454、455、457、461、503。没有这些数字、只有 Connection timed out，就回到端口和路由，别在 SDP 里找原因。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "code",
          title: "把状态码翻译成下一次只做的事",
          code: "NEXT = {\n    401: \"核对 Digest 的 uri、nonce 和预览权限\",\n    404: \"只改路径中的通道和码流\",\n    454: \"核对 Session，必要时重新 SETUP\",\n    455: \"检查方法顺序和是不是对直播发了 PAUSE\",\n    457: \"把 Range 改成 npt=0.000-\",\n    461: \"在 UDP 和 TCP 交织之间只切换一种\",\n    503: \"关掉别的播放器后再试一次\",\n}\n\ndef next_step(status: int) -> str:\n    return NEXT.get(status, \"先确认这是不是 RTSP 状态码，而不是 TCP 超时\")\n",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "ul",
          items: [
            "海康 404 先核对 通道*100+码流。通道 3 子码流是 302，不是 301。",
            "大华 401 有时是 ONVIF 用户没打开，网页密码其实是对的。看用户的预览权限，而不是只改特殊字符。",
            "宇视路径因固件而异。模板 404 时改用 ONVIF 给出的 URI，不要连试几十条。",
            "三家在路数满时都可能 503。主码流占用比子码流更常见。",
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
            "把所有失败都叫成密码错。只有 401 周围才是鉴权。",
            "454 时重新安装播放器。会话号和超时在抓包里就能看到。",
            "457 时更换摄像机。先看 Range 和这条 URL 是不是回放地址。",
            "503 时不断重连。重连会把仅剩的名额也占满，先 TEARDOWN 或关掉 VLC。",
            "一次提交里同时改了三处，成功了却写不出原因。笔记里留上一份失败原文。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "SETUP 返回 461。应该先动哪一项？",
      choices: ["用户密码", "URL 通道号", "Transport，改为设备支持的 UDP 或 TCP 交织", "Range 的 npt"],
      answer: 2,
      explain: "461 Unsupported Transport 只谈论传输。密码是 401，路径是 404，范围是 457。",
    },
    {
      prompt: "直播 URL 上发送了 PAUSE，应答 455。这说明什么？",
      choices: [
        "会话号过期",
        "这个方法在当前状态不被允许，直播常常不能像文件那样暂停",
        "端口被占用",
        "SPS 丢失",
      ],
      answer: 1,
      explain: "455 Method Not Valid in This State。直播预览上的 PAUSE 经常如此。454 才是会话找不到。",
    },
    {
      prompt: "DESCRIBE 返回 404。哪一句判断合适？",
      choices: [
        "把密码里的特殊字符去掉再试",
        "路径或通道不存在，先按厂商规则改路径",
        "改成 interleaved=0-1",
        "这是连接超时",
      ],
      answer: 1,
      explain: "404 Not Found 是 URI。海康看 Channels 末段，大华看 channel 和 subtype，宇视看 c 和 s。超时不会带回 404。",
    },
  ],
};

export const security: Lesson = {
  id: "security",
  phase: "阶段 14",
  title: "RTSPS、SRTP 和最小暴露",
  objective:
    "能区分 RTSPS 和 SRTP，并在拉流时避免把口令、抓包和 554 端口暴露到你不拥有的网络上。",
  minutes: 40,
  coreTopics: ["RTSPS 保护控制连接", "SRTP 保护媒体包", "口令、抓包和端口怎么收"],
  practice: [
    "用自己的话写两句：RTSPS 加密的是哪一条连接，SRTP 加密的是哪一种包。",
    "检查笔记和 shell 历史，把 {{url}} 里的口令换成已打红的形式。",
    "确认实验只针对你拥有或获准使用的设备。没有设备时停在自测，不扫描网段。",
  ],
  acceptance: [
    "能说明 Digest 不等于机密性。",
    "能指出 RTP/SAVP 才是 SRTP 的传输标记，乱码本身不是。",
    "能说出 554 不应直接暴露在不可信网络上。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "前面的 RTSP 是明文文本，RTP 是明文媒体。Digest 只是不把密码原样送出去。若链路经过你不信任的网络，需要另外的保护：RTSPS 给控制连接加 TLS，SRTP 给媒体包加加密和完整性。两者可以单独用，也可以一起用。",
        },
        {
          type: "terms",
          items: [
            {
              zh: "RTSPS",
              en: "RTSP over TLS",
              text: "把整条 RTSP TCP 放进 TLS。地址写成 rtsps://。海康常见端口 322，别的设备以网页为准。交织的 RTP 若走在这条 TLS 里面，会跟着被 TLS 保护。",
            },
            {
              zh: "安全实时传输协议",
              en: "SRTP, RFC 3711",
              text: "加密并认证 RTP 和 RTCP 载荷。SETUP 的传输写 RTP/SAVP，而不是 RTP/AVP。它不负责替你完成 DESCRIBE 的 TLS。",
            },
            {
              zh: "机密性",
              en: "confidentiality",
              text: "旁人看不到内容。Digest 没有提供它。没有 TLS 时，SDP 和 H.264 仍然可以被看见。",
            },
          ],
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "table",
          caption: "两套保护各管一段",
          headers: ["方案", "你在包里看到的", "保护了什么", "没保护什么"],
          rows: [
            ["只有 Digest", "RTSP 明文，Authorization 是摘要", "密码原文", "SDP、URL、视频"],
            ["RTSPS", "TCP 上先是 TLS，端口常不是 554", "这条 TLS 里的 RTSP，以及塞在里面的交织 RTP", "若媒体仍走外面的 UDP，那些 UDP 不在 TLS 里"],
            ["SRTP", "Transport 含 RTP/SAVP 或 RTP/SAVP/UDP", "RTP/RTCP 的载荷和完整性", "RTSP 文本本身，除非同时用了 RTSPS"],
            ["RTSPS + 交织", "只有一条 TLS", "控制和媒体都在隧道里", "仍要鉴权，TLS 不代替账号"],
          ],
        },
        {
          type: "code",
          title: "要 SRTP 时，Transport 的协议名会变",
          code: "Transport: RTP/SAVP;unicast;client_port=5000-5001",
        },
        {
          type: "p",
          text: "SAVP 是 SRTP 的配置。摄像机若仍回答 RTP/AVP，表示没谈成加密媒体。不要把普通 H.264 的高位字节误认成 SRTP。密钥如何分发由设备的安全配置或 SDP 里的加密属性决定，不在这一课展开实现。",
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "p",
          text: "教学地址 {{url}} 默认是 rtsp:// 而不是 rtsps://。{{urlNote}} 在你自己的 {{brand}} {{model}} 上，只有网页里确实打开了 TLS 或 SRTP，才改用对应的 URL 和 Transport。",
        },
        {
          type: "code",
          title: "FFmpeg 连接 RTSPS 时显式给出 TLS",
          code: "ffmpeg -rtsp_transport tcp -i \"rtsps://{{host}}:322/Streaming/Channels/101\" -t 3 -f null -",
        },
        {
          type: "callout",
          tone: "warn",
          title: "端口和路径以设备为准",
          text: "322 只是海康文档里常见的 RTSPS 端口。大华、宇视可能使用别的端口。上面的路径也只是海康主码流的例子，不要套到 {{brand}} 上。证书不受信任时，先在设备上核对，而不是关闭所有校验去迁就。",
        },
      ],
    },
    {
      id: "capture",
      blocks: [
        {
          type: "ul",
          items: [
            "rtsp 过滤器在 RTSPS 上会变空，因为载荷是 TLS。你应看到 TLS 握手，而不是 DESCRIBE 明文。",
            "SRTP 仍可能显示为 UDP 上的包，但载荷解不开成 H.264。配合 RTP/SAVP 判断，不要只看乱码。",
            "抓包含有摄像机地址和用户名时，按你的实验笔记保存，不要贴到公开仓库或工单附件。",
          ],
        },
      ],
    },
    {
      id: "commands",
      blocks: [
        { type: "callout", tone: "warn", text: "{{urlNote}}" },
        {
          type: "p",
          text: "在 {{os}} 上检查有没有把口令留在历史里。下面的命令只查询，不连接任何新主机。",
        },
        {
          type: "code",
          title: "在本机历史里找 rtsp URL",
          code: "grep -n \"rtsp://\" ~/.bash_history",
        },
        {
          type: "p",
          text: "找到带口令的行就删掉那些行。以后命令用环境变量或程序从单独的文件读取，并且文件不要提交进仓库。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "code",
          title: "打印前打红用户信息",
          code: "import re\n\ndef redact(text: str) -> str:\n    pattern = re.compile(r\"(rtsps?://[^:/\\s]+):([^@/\\s]+)@\")\n    return pattern.sub(r\"\\1:***@\", text)\n",
        },
        {
          type: "p",
          text: "这只隐藏 URL 里的口令，不隐藏单独打印的变量。日志语句不要传入 password。lab/rtsp_miniclient.py 的自测包含这一步。",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "table",
          headers: ["品牌", "和安全有关的常见开关"],
          rows: [
            ["海康威视", "RTSPS 常在 322。是否强制 Digest、是否关闭匿名，在网络和用户权限里分别设置"],
            ["大华", "TLS 端口看网页。RTSP 用户可能要单独授权预览"],
            ["宇视", "同样不要假设 322。以设备的 RTSP/TLS 页面为准"],
          ],
        },
        {
          type: "p",
          text: "出厂口令必须改掉。这三家的默认口令都被广泛试过。改口令是设备上的操作，不是在 URL 里多加一个参数。",
        },
      ],
    },
    {
      id: "pitfalls",
      blocks: [
        {
          type: "ul",
          items: [
            "把 Digest 当成加密。同一局域网里的人仍能看到 SDP 和视频，除非还有 RTSPS 或 SRTP。",
            "为了省事把 554 映射到公网。控制口令可以被挑战，视频会被直接拉走。需要远程时用你自己的 VPN，而不是开放端口。",
            "扫描网段寻找别人的摄像机。这门课只连接你拥有或被明确授权的设备。",
            "关闭 TLS 校验来消除证书报错。先弄清证书是谁签发的，再决定信不信任。",
            "把含 Authorization 的抓包提交进 git。仓库历史会留下用户名和 nonce。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "RTSPS 和 SRTP 的差别，哪一句是对的？",
      choices: [
        "它们是同一个协议的两个名字",
        "RTSPS 用 TLS 保护 RTSP 连接，SRTP 保护 RTP 媒体包，解决的不是同一段",
        "SRTP 取代了 DESCRIBE",
        "只用 Digest 就同时完成了这两件事",
      ],
      answer: 1,
      explain: "RTSPS 是跑在 TLS 上的 RTSP。SRTP 是加密的 RTP，Transport 里表现为 RTP/SAVP。Digest 只保护口令不被明文发送。",
    },
    {
      prompt: "哪种迹象说明对端在谈 SRTP？",
      choices: [
        "Follow TCP Stream 里出现乱码",
        "SETUP 的 Transport 使用 RTP/SAVP",
        "状态码 401",
        "载荷类型 96",
      ],
      answer: 1,
      explain: "RTP/SAVP 是 SRTP 的传输标记。交织的普通 H.264 也会在文本窗口里显示成乱码。401 是鉴权，96 只是动态载荷号。",
    },
    {
      prompt: "实验笔记里的 RTSP 地址应该怎么留？",
      choices: [
        "保留完整口令，方便下次复制",
        "口令打红，并且只记录你有权访问的设备",
        "发到公开问题单里让别人试",
        "写进将要提交的代码仓库",
      ],
      answer: 1,
      explain: "口令不属于笔记。抓包和 URL 只留在你自己的实验里，设备必须是你拥有或获准使用的。",
    },
  ],
};
