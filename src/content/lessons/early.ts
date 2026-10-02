import type { Lesson } from "../model";

export const primer: Lesson = {
  id: "primer",
  phase: "阶段 0",
  title: "动手前的网络底子",
  objective:
    "能说清 TCP 与 UDP 的差别，能看懂一条文本请求/响应，能确认摄像机的 554 端口通不通。",
  minutes: 40,
  coreTopics: [
    "IP、端口、TCP、UDP",
    "HTTP 文本报文和 RTSP 的相似处",
    "用端口探测代替盲目播放",
  ],
  practice: [
    "在纸上写出：你的电脑 IP、摄像机 IP、RTSP 端口。没有设备就写 127.0.0.1 和 8554。",
    "用系统自带命令探测 {{host}} 的 554 端口，把成功或超时的原文留住。",
    "打开 Wireshark，只抓这个探测，练习用 ip.addr == {{host}} 缩小范围。",
  ],
  acceptance: [
    "能用自己的话区分 TCP 和 UDP，并各举一个和视频有关的例子。",
    "能指出一条报文里的请求行、头部和空行。",
    "能判断「网页打得开」并不等于「RTSP 拉得了」。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "IPC 是 IP Camera，网络摄像机。它和电脑一样有 IP 地址。你要看它的实时画面，电脑先得找到这台设备，再在某个端口上把「请开始送视频」说清楚。RTSP 就是后面那句控制话；这一节先把找得到、连得上说清楚。",
        },
        {
          type: "terms",
          items: [
            {
              zh: "端口",
              en: "port",
              text: "一台主机上的门牌。RTSP 默认走 554。网页管理多半走 80 或 443。门牌不同，协议就可以同时开着。",
            },
            {
              zh: "传输控制协议",
              en: "TCP",
              text: "先建立连接，按顺序可靠送达，丢了会重传。RTSP 控制命令几乎总是跑在 TCP 上。",
            },
            {
              zh: "用户数据报协议",
              en: "UDP",
              text: "不建立连接，不保证送达和顺序。实时视频经常用它送画面，因为晚到的旧画面不如直接等下一帧。",
            },
            {
              zh: "超文本传输协议",
              en: "HTTP",
              text: "浏览器访问摄像机网页用的文本协议。RTSP 长得像它：也有请求行、头部、空行和可选正文。",
            },
          ],
        },
        {
          type: "table",
          caption: "先记住这三层，后面所有模块都落在这张表里",
          headers: ["你看到的东西", "通常用什么", "丢了会怎样"],
          rows: [
            ["登录网页、ONVIF 设备管理", "HTTP / TCP", "页面打不开或接口超时"],
            ["播放、暂停、拆会话", "RTSP / TCP 554", "VLC 立刻报无法打开"],
            ["真正的视频和音频", "RTP / UDP 或塞进同一条 TCP", "花屏、卡顿或只有声音"],
          ],
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "p",
          text: "文本协议可以当成写信。第一行说明想干什么，后面每一行是一个字段，然后必须有一个空行。空行表示头部结束。RTSP 和 HTTP 都遵守这件事。",
        },
        {
          type: "code",
          title: "HTTP 请求，用来对照，不是 RTSP",
          code: "GET / HTTP/1.1\r\nHost: 192.168.1.64\r\n\r\n",
        },
        {
          type: "table",
          headers: ["片段", "名字", "作用"],
          rows: [
            ["GET / HTTP/1.1", "请求行", "方法、路径、版本"],
            ["Host: 192.168.1.64", "头部", "名字大小写不敏感，值从冒号后开始"],
            ["最后的空行", "头部结束", "没有这一行，对方会一直等"],
          ],
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "p",
          text: "下面这条还不是完整播放流程，只是问摄像机：你的 554 端口上有没有一个会说话的 RTSP 服务。",
        },
        {
          type: "code",
          title: "最小 RTSP 询问",
          code: "OPTIONS rtsp://192.168.1.64:554/Streaming/Channels/101 RTSP/1.0\r\nCSeq: 1\r\n\r\n",
        },
        {
          type: "callout",
          tone: "note",
          title: "CSeq 是什么",
          text: "CSeq 是命令序号，Command Sequence。客户端每发一条就加一，摄像机的应答里原样带回。这样两条命令来回交叉时，你仍知道哪条应答对应哪条请求。",
        },
      ],
    },
    {
      id: "capture",
      blocks: [
        {
          type: "p",
          text: "Wireshark 是抓包工具。过滤器决定你看见哪些包。先少看，再逐步放宽。",
        },
        {
          type: "table",
          caption: "这一节只用这几个过滤表达式",
          headers: ["过滤表达式", "留下什么"],
          rows: [
            ["ip.addr == {{host}}", "只看你和这台摄像机之间的包"],
            ["tcp.port == 554", "只看 RTSP 默认端口"],
            ["tcp.flags.syn == 1 && tcp.flags.ack == 0", "只看发起连接的 SYN"],
          ],
        },
        {
          type: "ul",
          items: [
            "选对网卡。电脑用网线就选有线网卡，不要选任意、回环或已经断开的适配器。",
            "右键一条 TCP 包，选择 Follow → TCP Stream，文本对话会按顺序拼出来。",
            "若一个包都没有，先别怀疑 RTSP。先看 IP 是否写错、网卡是否选错。",
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
          title: "Linux / macOS：探测 554 是否接受 TCP 连接",
          code: "nc -vz {{host}} 554",
        },
        {
          type: "code",
          title: "Windows PowerShell",
          code: "Test-NetConnection {{host}} -Port 554",
        },
        {
          type: "p",
          text: "TcpTestSucceeded 为 True，或 nc 显示 succeeded，只说明 TCP 端口开着。它还不说明用户名、路径和编码是对的。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "p",
          text: "用你熟悉的 {{lang}} 之前，先看这段 Python。它只做一件事：TCP 三次握手能不能在 3 秒内完成。",
        },
        {
          type: "code",
          title: "探测 RTSP 端口",
          code: "import socket\n\ndef port_open(host: str, port: int = 554, timeout: float = 3) -> bool:\n    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n    sock.settimeout(timeout)\n    try:\n        sock.connect((host, port))\n        return True\n    except OSError as exc:\n        print(f\"{host}:{port} 连不上: {exc}\")\n        return False\n    finally:\n        sock.close()\n",
        },
        {
          type: "callout",
          tone: "tip",
          title: "如果你主要写 C/C++",
          text: "对应的是 socket、connect 和一个 3 秒的接收超时。这一路课程的可运行练习放在 Python，因为 RTSP 是文本协议，打印字符串比管理缓冲区更容易核对。",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "table",
          headers: ["品牌", "网页端口", "RTSP 端口", "这一节要确认的事"],
          rows: [
            ["海康威视", "80，常可改", "554，可在网络设置里改", "网页能开不代表 554 没被关掉"],
            ["大华", "80", "554", "NVR 和 IPC 的端口要分开看"],
            ["宇视", "80", "554", "有的工程把 RTSP 改到非 554，以网页为准"],
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
            "摄像机禁 ping 很常见。ping 不通不能推出 RTSP 不通。",
            "你和摄像机不在同一网段，又没有路由时，TCP 会超时，而不是返回 401。",
            "公司网络可能隔离访客网和摄像机网。电脑能上网，不代表能访问 192.168.1.64。",
            "抓包抓错网卡时，过滤表达式写得再对也是空的。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "VLC 打不开流，但摄像机网页能登录。哪一个判断最合适？",
      choices: [
        "网页能开，所以 RTSP 一定是好的，问题只在 VLC",
        "网页多半走 80 端口的 HTTP，RTSP 的 554 仍可能被关掉、被防火墙拦住或路径写错",
        "说明 UDP 一定被禁了",
        "说明密码一定错了",
      ],
      answer: 1,
      explain:
        "管理和播放不是同一扇门。网页成功只证明 HTTP 那条路通，而且账号至少能登录网页。RTSP 端口、路径和权限还要单独查。",
    },
    {
      prompt: "RTSP 控制命令为什么几乎总是放在 TCP 上？",
      choices: [
        "因为 TCP 的端口号更大",
        "因为播放、鉴权和拆会话需要按顺序可靠送达，丢一条命令会话就会乱",
        "因为 UDP 不能传文本",
        "因为标准禁止 UDP 存在",
      ],
      answer: 1,
      explain:
        "控制面丢一条 SETUP 或搞乱顺序，后面的 RTP 就没有正确的会话。UDP 可以传文本，只是它不负责可靠性。视频数据本身仍常常用 UDP。",
    },
    {
      prompt: "一条文本请求里，头部在哪里结束？",
      choices: [
        "第一个冒号处",
        "连续的空行，也就是 \\r\\n\\r\\n",
        "CSeq 那一行结束",
        "IP 地址结束",
      ],
      answer: 1,
      explain: "头部和正文用一个空行分开。写客户端时如果少发这一个空行，摄像机不会开始解析这条命令。",
    },
  ],
};

export const place: Lesson = {
  id: "place",
  phase: "阶段 1",
  title: "RTSP 在 IPC 里站在哪",
  objective:
    "能画出一次实时预览里 RTSP、SDP、RTP、RTCP 各做哪一段，并说明 ONVIF、GB28181 和 RTSP 不是互相替代的关系。",
  minutes: 45,
  coreTopics: ["控制面和媒体面", "RTSP、SDP、RTP、RTCP 的分工", "ONVIF 与 GB28181 如何碰到 RTSP"],
  practice: [
    "不看笔记，画出客户端、RTSP、SDP、RTP、RTCP 五者的箭头。",
    "用一句话回答：ONVIF 的 GetStreamUri 返回的是什么，它自己播不播视频。",
    "对照 {{brand}} 的设备，写出你准备使用的 URL：{{url}}",
  ],
  acceptance: [
    "能指出「信令」和「码流」分别落在哪条协议上。",
    "能说明 RTSP 1.0 仍是目前 IPC 的主流，RTSP 2.0 很少直接出现。",
    "能说明国标 GB28181 常用 SIP 信令加 PS over RTP，而不是用 RTSP 替代 SIP。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "实时预览要先谈成，再送画面。谈条件的是 RTSP，谈出来的说明书是 SDP，送画面的是 RTP，汇报收得怎么样的是 RTCP。把这四件事分成两个面：控制面负责开会，媒体面负责交货。",
        },
        {
          type: "terms",
          items: [
            {
              zh: "实时流协议",
              en: "RTSP, Real Time Streaming Protocol",
              text: "RFC 2326 是 1.0，IPC 几乎都说 RTSP/1.0。RFC 7826 是 2.0，摄像机固件里很少见。它负责 OPTIONS、DESCRIBE、SETUP、PLAY 这些动词，不负责像素。",
            },
            {
              zh: "会话描述协议",
              en: "SDP, Session Description Protocol",
              text: "一份纯文本说明书。里面写着有几路媒体、编码是 H.264 还是 H.265、RTP 时钟是多少、每一路的控制地址是什么。",
            },
            {
              zh: "实时传输协议",
              en: "RTP, Real-time Transport Protocol",
              text: "媒体包。每个包带序列号、时间戳和同步源。视频被切成这种包之后才在网上跑。",
            },
            {
              zh: "实时传输控制协议",
              en: "RTCP",
              text: "和 RTP 配对的报告。发送方报告包数，接收方报告丢包和抖动。它不是第二路视频。",
            },
            {
              zh: "开放网络视频接口论坛",
              en: "ONVIF",
              text: "用 HTTP 上的 SOAP 管理设备、用户和媒体配置。GetStreamUri 的产物通常是一条 RTSP 地址。ONVIF 不取代 RTP。",
            },
            {
              zh: "公共安全视频监控联网",
              en: "GB/T 28181",
              text: "国内平台级联常用的国标。信令是 SIP，媒体常常是 PS 封装再放进 RTP。平台可以同时支持 RTSP 拉摄像机和 GB28181 接下级平台，这是两条入口。",
            },
          ],
        },
        {
          type: "sequence",
          caption: "一次直播预览的分工",
          steps: [
            { from: "客户端", to: "IPC", title: "RTSP DESCRIBE", detail: "请把这份流的说明书给我" },
            { from: "IPC", to: "客户端", title: "200 OK + SDP", detail: "视频 H.264，音频 G.711，控制地址在 a=control" },
            { from: "客户端", to: "IPC", title: "RTSP SETUP / PLAY", detail: "选定 UDP 或 TCP，然后开始" },
            { from: "IPC", to: "客户端", title: "RTP 媒体包", detail: "画面和声音。可以走另一对 UDP 端口，也可以塞进原来的 TCP" },
            { from: "客户端", to: "IPC", title: "RTCP 接收报告", detail: "我丢了多少、抖动多大。有的设备也靠它判断你还活着" },
          ],
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "table",
          caption: "和 RTSP 相邻的协议，各自的第一行长什么样",
          headers: ["协议", "你在包里首先会看见", "默认端口习惯"],
          rows: [
            ["RTSP 1.0", "OPTIONS / DESCRIBE / SETUP / PLAY ... RTSP/1.0", "TCP 554"],
            ["SDP", "v=0 开头的若干行", "没有独立端口，它是 DESCRIBE 的正文"],
            ["RTP", "二进制，版本号通常是 2", "UDP 偶数端口，或 TCP 交织"],
            ["RTCP", "二进制报告，类型 SR、RR、SDES", "RTP 端口加 1"],
            ["ONVIF", "HTTP POST，XML 里有 GetStreamUri", "TCP 80，或设备自定的 HTTP 端口"],
            ["GB28181", "SIP INVITE / MESSAGE", "UDP 5060 很常见，以平台登记为准"],
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "RTSP 2.0 先知道名字即可",
          text: "RTSP 2.0 要求管道化，并增加了 PLAY_NOTIFY 等机制。你在海康、大华、宇视的实时预览里看到的版本行仍几乎总是 RTSP/1.0。版本对不上时，先相信抓包，不要按 2.0 的状态机去套 1.0 的摄像机。",
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "p",
          text: "ONVIF 不直接吐出 H.264。它把「这路主码流该用哪条 RTSP」交给你。下面是响应里真正重要的那一小段，命名空间已省掉。",
        },
        {
          type: "code",
          title: "GetStreamUri 响应里和播放有关的部分",
          code: "<tt:Uri>rtsp://192.168.1.64:554/Streaming/Channels/101</tt:Uri>\n<tt:InvalidAfterConnect>false</tt:InvalidAfterConnect>\n<tt:InvalidAfterReboot>false</tt:InvalidAfterReboot>",
        },
        {
          type: "p",
          text: "拿到这条 URI 之后，播放器才开始本课程要学的 RTSP。国标设备则另走 SIP INVITE，SDP 里常见的是 PS（Program Stream）而不是直接写 H264 的 rtpmap。平台网关经常一边用 RTSP 拉 IPC，一边用 GB28181 往上送。",
        },
      ],
    },
    {
      id: "capture",
      blocks: [
        {
          type: "table",
          headers: ["你想回答的问题", "Wireshark 过滤表达式"],
          rows: [
            ["控制对话在不在", "rtsp"],
            ["说明书在不在", "sdp"],
            ["视频包在不在", "rtp"],
            ["丢包报告在不在", "rtcp"],
            ["是不是 ONVIF 在要地址", "http contains \"GetStreamUri\""],
            ["是不是国标信令", "sip"],
          ],
        },
        {
          type: "p",
          text: "如果 rtsp 有 DESCRIBE 和 PLAY，但 rtp 一个包都没有，问题已经不在「地址是否存在」，而在传输方式或防火墙。这个分界是后面排障的起点。",
        },
      ],
    },
    {
      id: "commands",
      blocks: [
        { type: "callout", tone: "warn", text: "{{urlNote}}" },
        {
          type: "code",
          title: "让 FFmpeg 只探说明书，先不解码",
          code: "ffprobe -rtsp_transport tcp -v debug -show_streams \"{{url}}\"",
        },
        {
          type: "p",
          text: "debug 日志里能看到它发出的 OPTIONS、DESCRIBE、SETUP 和 PLAY。这是不打开 Wireshark 时最快的「RTSP 在不在工作」检查。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "p",
          text: "先写一个分类函数。以后抓包或读日志时，用它提醒自己当前看到的是哪一个面。",
        },
        {
          type: "code",
          title: "把一行日志分到控制面或媒体面",
          code: "def plane(line: str) -> str:\n    text = line.strip()\n    if text.startswith(\"v=0\") or text.startswith(\"m=\") or text.startswith(\"a=\"):\n        return \"SDP 说明书\"\n    head = text.split(\" \", 1)[0]\n    if head in {\"OPTIONS\", \"DESCRIBE\", \"SETUP\", \"PLAY\", \"PAUSE\", \"TEARDOWN\", \"GET_PARAMETER\", \"SET_PARAMETER\", \"RTSP/1.0\"}:\n        return \"RTSP 控制面\"\n    return \"可能是 RTP/RTCP 或别的二进制\"\n",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "table",
          headers: ["品牌", "ONVIF 与 RTSP 的常见关系", "国标场景"],
          rows: [
            ["海康威视", "网页或 ISAPI、ONVIF 都能给出 RTSP。老地址和新地址可能共存", "设备可单独开 GB28181，与 RTSP 预览互不取消"],
            ["大华", "ONVIF 的 GetStreamUri 常返回带 channel 和 subtype 的 RTSP", "同上，平台接入不要假设关掉了 RTSP"],
            ["宇视", "不同固件的 RTSP 路径差别大，ONVIF 拿到的 URI 比记忆口诀可靠", "以平台登记的 SIP 端口为准，不要拿 554 去套国标"],
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
            "把 ONVIF 端口当成播放端口。管理成功只代表要到了地址。",
            "用 GB28181 的设备编号去拼 RTSP 路径。国标 ID 不是通道 URL。",
            "看到 RTSP/1.0 却按 RTSP 2.0 要求对方支持管道化。IPC 通常要一问一答。",
            "以为 SDP 是独立服务。它只是 DESCRIBE 应答的正文。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "一次普通的 IPC 实时预览里，H.264 画面实际装在哪种包里？",
      choices: ["RTSP 的 PLAY 正文", "SDP 的 a=fmtp", "RTP", "ONVIF 的 SOAP"],
      answer: 2,
      explain: "RTSP 只把播放谈成，SDP 描述编码参数，RTP 才装载 NAL 单元。ONVIF 负责给出 RTSP 地址。",
    },
    {
      prompt: "GB28181 和 RTSP 的关系，哪一种说法站得住？",
      choices: [
        "国标就是 RTSP 换了个端口",
        "国标信令常用 SIP，媒体常用 PS over RTP；平台仍可以另外用 RTSP 拉摄像机",
        "开了国标就必须关闭 554",
        "GB28181 不使用 RTP",
      ],
      answer: 1,
      explain: "两条接入可以并存。国标的会话由 SIP 发起，RTP 里经常是 PS 封装；这和 RTSP 拉裸 H.264/H.265 不是同一步。",
    },
    {
      prompt: "你在 DESCRIBE 的应答正文里看到 v=0 和 m=video。这是什么？",
      choices: ["RTP 包头", "SDP", "RTCP 发送者报告", "HTTP 分块编码"],
      answer: 1,
      explain: "v= 是协议版本，m= 是媒体行，都是 SDP 的语法。",
    },
  ],
};

export const methods: Lesson = {
  id: "methods",
  phase: "阶段 2",
  title: "RTSP 方法",
  objective: "能按顺序讲完一次直播的 OPTIONS、DESCRIBE、SETUP、PLAY 和 TEARDOWN，并知道 PAUSE、GET_PARAMETER 在直播摄像机上哪些可靠。",
  minutes: 55,
  coreTopics: ["方法名、请求 URI、版本", "直播最少的五步", "哪些方法不改变状态"],
  practice: [
    "在教练台里把这一节的握手点完，不看解析先自己说出每一步的目的。",
    "对 {{url}} 只发 OPTIONS，把 Public 头抄下来。",
    "对照 Public 头，标出这台设备有没有列出 PAUSE 和 GET_PARAMETER。",
  ],
  acceptance: [
    "能默写直播最少调用顺序：DESCRIBE 之前可以 OPTIONS，PLAY 之前必须有成功的 SETUP。",
    "能解释 Public、Accept、Content-Type、Content-Length 各在哪一条消息里出现。",
    "能说出 PAUSE 对很多直播 IPC 没有文件回放意义上的暂停。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "RTSP 方法是请求行里的动词。直播不是把所有动词都走一遍。最少路径是：可选的 OPTIONS，然后 DESCRIBE 拿说明书，对每一路媒体 SETUP，再 PLAY，结束时 TEARDOWN。",
        },
        {
          type: "table",
          caption: "IPC 上会遇见的方法",
          headers: ["方法", "谁发起", "它要什么", "直播里常见吗"],
          rows: [
            ["OPTIONS", "客户端", "问对方支持哪些方法", "常见，也常被拿来保活"],
            ["DESCRIBE", "客户端", "要 SDP", "每次播放都有"],
            ["ANNOUNCE", "客户端", "客户端向服务器提交 SDP", "摄像机预览基本不用"],
            ["SETUP", "客户端", "为一路媒体选定传输", "每一路音频或视频一次"],
            ["PLAY", "客户端", "按 Range 开始送 RTP", "SETUP 成功之后"],
            ["PAUSE", "客户端", "暂停", "文件回放才可靠，直播常 455 或不停"],
            ["TEARDOWN", "客户端", "结束这一路或整个会话", "正常关闭要发"],
            ["GET_PARAMETER", "客户端", "读参数，正文可空", "常用来保活"],
            ["SET_PARAMETER", "客户端", "写参数", "直播预览少见"],
            ["REDIRECT", "服务器", "让客户端换地址", "少见"],
            ["RECORD", "客户端", "让服务器录像", "预览客户端不要发"],
          ],
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "p",
          text: "请求行是「方法、空格、绝对 URI、空格、RTSP/1.0」。URI 用 rtsp:// 开头的绝对地址，不像浏览器那样只写路径。应答行是「RTSP/1.0、空格、数字状态码、空格、原因短语」。",
        },
        {
          type: "table",
          caption: "这一节先掌握的状态码",
          headers: ["状态码", "原因短语", "何时出现"],
          rows: [
            ["200", "OK", "这条方法被接受"],
            ["401", "Unauthorized", "要鉴权，应答里有 WWW-Authenticate"],
            ["404", "Not Found", "路径或通道不存在"],
            ["405", "Method Not Allowed", "方法名字对，但这台设备不许"],
            ["454", "Session Not Found", "Session 头缺失、写错或已经超时"],
            ["455", "Method Not Valid in This State", "例如还没 SETUP 就 PLAY"],
            ["461", "Unsupported Transport", "Transport 头里的方式它不支持"],
            ["500", "Internal Server Error", "设备内部失败"],
            ["503", "Service Unavailable", "连接数满或服务暂时拒绝"],
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "Public 头",
          text: "OPTIONS 的 200 里常见 Public: OPTIONS, DESCRIBE, SETUP, TEARDOWN, PLAY, GET_PARAMETER。把它当成广告，不要当成合同。有的固件列了 PAUSE 但直播调用返回 455；也有的没列出 GET_PARAMETER 却接受空正文保活。",
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "walk",
          caption: "点完这一次握手。地址是实验摄像机 192.168.1.64，还没有加鉴权。",
          steps: [
            {
              name: "OPTIONS",
              send: "OPTIONS rtsp://192.168.1.64:554/Streaming/Channels/101 RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: rtsp-coach\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 1\r\nPublic: OPTIONS, DESCRIBE, SETUP, TEARDOWN, PLAY, PAUSE, GET_PARAMETER, SET_PARAMETER\r\n\r\n",
              why: "先问能力。Public 是服务器自称支持的方法列表。CSeq 必须和请求一致。",
            },
            {
              name: "DESCRIBE",
              send: "DESCRIBE rtsp://192.168.1.64:554/Streaming/Channels/101 RTSP/1.0\r\nCSeq: 2\r\nUser-Agent: rtsp-coach\r\nAccept: application/sdp\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 2\r\nContent-Type: application/sdp\r\nContent-Base: rtsp://192.168.1.64:554/Streaming/Channels/101/\r\nContent-Length: 412\r\n\r\n(SDP 正文，下一模块拆开)",
              why: "Accept 告诉对方你要 SDP。Content-Base 是后面相对控制地址的基准，Content-Length 是正文的字节数。",
            },
            {
              name: "SETUP",
              send: "SETUP rtsp://192.168.1.64:554/Streaming/Channels/101/trackID=1 RTSP/1.0\r\nCSeq: 3\r\nUser-Agent: rtsp-coach\r\nTransport: RTP/AVP/TCP;unicast;interleaved=0-1\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 3\r\nSession: 9A3F22B1;timeout=60\r\nTransport: RTP/AVP/TCP;unicast;interleaved=0-1\r\n\r\n",
              why: "SETUP 的 URI 是这一路媒体，不是整个表现地址。Session 从这里开始要一直带着。timeout=60 表示大约 60 秒内要有保活。",
            },
            {
              name: "PLAY",
              send: "PLAY rtsp://192.168.1.64:554/Streaming/Channels/101/ RTSP/1.0\r\nCSeq: 4\r\nUser-Agent: rtsp-coach\r\nSession: 9A3F22B1\r\nRange: npt=0.000-\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 4\r\nSession: 9A3F22B1\r\nRTP-Info: url=rtsp://192.168.1.64:554/Streaming/Channels/101/trackID=1;seq=18421;rtptime=305419896\r\n\r\n",
              why: "Range 用 NPT，Normal Play Time。直播通常从 0 开始并省略结束时间，表示现在就开始。RTP-Info 告诉你第一个 RTP 包的序列号和时间戳。",
            },
            {
              name: "TEARDOWN",
              send: "TEARDOWN rtsp://192.168.1.64:554/Streaming/Channels/101/ RTSP/1.0\r\nCSeq: 5\r\nUser-Agent: rtsp-coach\r\nSession: 9A3F22B1\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 5\r\nSession: 9A3F22B1\r\n\r\n",
              why: "正常离开要拆会话。直接拔掉 TCP，设备也最终会超时，但会占着一路连接数。",
            },
          ],
        },
      ],
    },
    {
      id: "capture",
      blocks: [
        {
          type: "table",
          headers: ["过滤表达式", "用途"],
          rows: [
            ["rtsp.method == \"DESCRIBE\"", "只看要说明书的请求"],
            ["rtsp.method == \"SETUP\"", "只看选传输"],
            ["rtsp.method == \"PLAY\"", "只看开始播放"],
            ["rtsp.status == 200", "只看成功应答"],
            ["rtsp.status >= 400", "只看失败"],
          ],
        },
        {
          type: "p",
          text: "在 Follow TCP Stream 里，红色和蓝色会把客户端与摄像机的文本分开。二进制 RTP 开始后，这条 TCP 流里会混进不可读字符，那是交织模式，传输模块再拆。",
        },
      ],
    },
    {
      id: "commands",
      blocks: [
        { type: "callout", tone: "warn", text: "{{urlNote}}" },
        {
          type: "code",
          title: "用 FFmpeg 把 RTSP 对话打到终端",
          code: "ffmpeg -rtsp_transport tcp -loglevel debug -i \"{{url}}\" -t 3 -f null -",
        },
        {
          type: "p",
          text: "-t 3 只拉 3 秒。-f null 表示解码结果丢掉，用来看握手而不是存文件。日志里搜索 method OPTIONS、method DESCRIBE。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "code",
          title: "拼一条带 CSeq 的请求",
          code: "def rtsp_request(method: str, uri: str, cseq: int, headers: dict[str, str] | None = None) -> bytes:\n    lines = [f\"{method} {uri} RTSP/1.0\", f\"CSeq: {cseq}\", \"User-Agent: rtsp-coach\"]\n    for name, value in (headers or {}).items():\n        lines.append(f\"{name}: {value}\")\n    return (\"\\r\\n\".join(lines) + \"\\r\\n\\r\\n\").encode(\"utf-8\")\n",
        },
        {
          type: "callout",
          tone: "tip",
          text: "行尾必须是 CRLF，也就是 \\r\\n，不是只有 \\n。最后还要再空一行。",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "table",
          headers: ["品牌", "方法上的差别"],
          rows: [
            ["海康威视", "直播五步完整。PAUSE 多用于录像回放 URL，预览 URL 上经常无效"],
            ["大华", "同样五步。Public 列表随固件变化，以抓包为准"],
            ["宇视", "有的固件 OPTIONS 的 Public 很短，但 DESCRIBE 和 SETUP 仍然可用"],
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
            "在一条 TCP 上不等应答就连发多条。不少 IPC 不支持 RTSP 管道化，第二条会被忽略或把 CSeq 搞乱。",
            "SETUP 仍使用表现地址，而不是 SDP 里那一路的 control。结果是 404 或建错会话。",
            "PLAY 忘了带 Session。已经 SETUP 过也会 454。",
            "把 404 当成密码错误。密码问题是 401，路径问题才是 404。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "还没有收到任何 SETUP 的 200，客户端就发送 PLAY。最符合 RTSP 1.0 的结果是？",
      choices: ["200 OK，并立刻收到 RTP", "455 Method Not Valid in This State", "461 Unsupported Transport", "200 OK，但只有音频"],
      answer: 1,
      explain: "PLAY 属于播放状态才合法的方法。会话还停在 Init 时发 PLAY，状态不对，典型应答是 455。",
    },
    {
      prompt: "DESCRIBE 请求里 Accept: application/sdp 的作用是？",
      choices: ["指定 RTP 端口", "告诉服务器客户端能接受的描述格式是 SDP", "提交用户名", "打开 TCP 交织"],
      answer: 1,
      explain: "没有这个头，有的设备仍返回 SDP，但写明 Accept 是完整客户端该做的。应答用 Content-Type: application/sdp 呼应它。",
    },
    {
      prompt: "OPTIONS 应答里的 Public 头应该怎么用？",
      choices: ["当成绝对合同，没列出的方法一定不能发", "当成自述，再抓一次真实调用核对", "只在 RTSP 2.0 里出现", "里面是 RTP 序列号"],
      answer: 1,
      explain: "固件的 Public 列表和真实行为会不一致。它适合当线索，不适合当唯一依据。",
    },
  ],
};

export const state: Lesson = {
  id: "state",
  phase: "阶段 3",
  title: "状态机、会话和头部",
  objective: "能根据上一条成功的方法判断会话处在 Init、Ready 还是 Playing，并正确携带 CSeq、Session、Transport 和 Range。",
  minutes: 50,
  coreTopics: ["Init、Ready、Playing", "CSeq 与 Session", "Transport、Range、RTP-Info、Require、User-Agent"],
  practice: [
    "盖住状态图，写出 SETUP 成功后、PLAY 成功后、TEARDOWN 成功后各在哪个状态。",
    "拿一条 PLAY 请求，圈出如果删掉就会 454 的那个头。",
    "把 Session 值原样抄进 TEARDOWN，不要把它转成整数。",
  ],
  acceptance: [
    "能解释 timeout 参数属于 Session 头，单位是秒。",
    "能说明 Session 是不透明字符串。",
    "能指出 Require 不被支持时会得到 551，而不是 401。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "RTSP 会话是一台摄像机为你留的播放上下文。状态机约束的是「现在允许哪个动词」。记三个状态就够用：Init 还没有传输，Ready 已经 SETUP 但没在播，Playing 正在送 RTP。",
        },
        {
          type: "table",
          caption: "RFC 2326 里和直播有关的状态迁移",
          headers: ["当前状态", "成功的方法", "新状态"],
          rows: [
            ["Init", "SETUP", "Ready"],
            ["Ready", "SETUP 另一路", "Ready"],
            ["Ready", "PLAY", "Playing"],
            ["Ready", "TEARDOWN", "Init"],
            ["Playing", "PAUSE", "Ready"],
            ["Playing", "PLAY", "Playing"],
            ["Playing", "SETUP 另一路", "Playing"],
            ["Playing", "TEARDOWN", "Init"],
          ],
        },
        {
          type: "p",
          text: "OPTIONS、DESCRIBE、GET_PARAMETER、SET_PARAMETER 不改变上面的状态。所以保活可以在 Playing 里反复做。",
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "table",
          caption: "头部不是装饰",
          headers: ["头部", "出现在", "你要遵守的规则"],
          rows: [
            ["CSeq", "每条请求和对应应答", "应答必须带回同一个数。下一条请求换一个新数"],
            ["Session", "SETUP 的应答，以及之后的 PLAY、PAUSE、TEARDOWN、保活", "原样复制，包含字母时也不要改写"],
            ["Transport", "SETUP 请求和应答", "请求提出希望，应答才是真正谈成的结果"],
            ["Range", "PLAY，有时 PAUSE", "直播写 npt=0.000- 。结束时间空着表示一直播"],
            ["RTP-Info", "PLAY 的应答", "给出 url、seq 和 rtptime，用来对齐第一包"],
            ["User-Agent", "请求", "标明客户端。个别老固件会拒绝空代理或某个特定字符串"],
            ["Require", "请求", "声明对方必须懂的扩展。不懂就应返回 551 Option not supported"],
            ["Content-Base", "DESCRIBE 应答", "相对 a=control 的拼接基准"],
            ["Content-Length", "带正文的消息", "正文字节数。SDP 和部分 GET_PARAMETER 需要它"],
          ],
        },
        { type: "code", title: "Session 头里的超时", code: "Session: 9A3F22B1;timeout=60" },
        {
          type: "p",
          text: "分号后面的 timeout 是参数，不是会话号的一部分。会话号只到分号前面。60 的单位是秒：若这段时间里既没有 RTSP 请求，设备又认定没有别的保活，会话会被收掉。",
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "sequence",
          caption: "状态只在成功应答之后前进",
          steps: [
            { from: "客户端", to: "IPC", title: "SETUP", detail: "状态仍是 Init，直到 200 到来" },
            { from: "IPC", to: "客户端", title: "200 + Session", detail: "进入 Ready" },
            { from: "客户端", to: "IPC", title: "PLAY + Session + Range", detail: "还在 Ready" },
            { from: "IPC", to: "客户端", title: "200 + RTP-Info", detail: "进入 Playing，随后 RTP 到达" },
            { from: "客户端", to: "IPC", title: "GET_PARAMETER + Session", detail: "保持 Playing" },
            { from: "客户端", to: "IPC", title: "TEARDOWN + Session", detail: "200 之后回到 Init" },
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "失败不应推进状态",
          text: "SETUP 得到 461 时你仍在 Init。不要带着一个从未出现过的 Session 去 PLAY。",
        },
      ],
    },
    {
      id: "capture",
      blocks: [
        {
          type: "table",
          headers: ["过滤表达式", "看什么"],
          rows: [
            ["rtsp.session", "所有带着会话号的包"],
            ["rtsp.transport", "SETUP 双方真正谈成的传输"],
            ["rtsp.user_agent", "是 VLC、FFmpeg 还是你自己的客户端"],
          ],
        },
        {
          type: "ol",
          items: [
            "点开 SETUP 的 200，展开 Session 字段，把超时单独记下来。",
            "点开下一条 PLAY，确认 Session 字符串和上一包完全相同。",
            "若 PLAY 是 454，先比对 Session，再看两条消息的时间差是不是已经超过 timeout。",
          ],
        },
      ],
    },
    {
      id: "commands",
      blocks: [
        { type: "callout", tone: "warn", text: "{{urlNote}}" },
        { type: "code", title: "Live555 的 openRTSP 会替你走完状态机", code: "openRTSP -t -d 5 \"{{url}}\"" },
        {
          type: "p",
          text: "-t 表示 RTP over TCP。-d 5 播放 5 秒后退出。没有 openRTSP 时跳过。安装 Live555 的 testProgs 后，这个命令用来对照一个成熟客户端。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "code",
          title: "解析应答头，并拆开 Session",
          code: "def parse_headers(blob: str) -> dict[str, str]:\n    lines = blob.replace(\"\\r\\n\", \"\\n\").split(\"\\n\")\n    headers: dict[str, str] = {}\n    for line in lines[1:]:\n        if not line.strip():\n            break\n        name, value = line.split(\":\", 1)\n        headers[name.strip().lower()] = value.strip()\n    return headers\n\ndef session_id(headers: dict[str, str]) -> tuple[str, int | None]:\n    raw = headers[\"session\"]\n    ident, _, param = raw.partition(\";\")\n    timeout = None\n    if \"timeout=\" in param:\n        timeout = int(param.split(\"timeout=\", 1)[1].split(\";\", 1)[0])\n    return ident.strip(), timeout\n",
        },
        {
          type: "p",
          text: "头部名在比较前转成小写。RTSP 和 HTTP 一样，Content-Type 与 content-type 是同一个头。会话号不要转整数：9A3F22B1 一转就坏了。",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "table",
          headers: ["品牌", "会话和头部上的习惯"],
          rows: [
            ["海康威视", "Session 常为十六进制样的字符串，timeout 常见 60 秒"],
            ["大华", "Session 可能是纯数字，但仍按字符串保存。录像回放才会频繁用 Range 跳转"],
            ["宇视", "有的固件不返回 timeout。没写时不要假设无限长，按 30 到 60 秒去保活更稳"],
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
            "CSeq 重复。重传同一条请求可以重复，新的请求不该复用旧序号。",
            "把 Session 参数 timeout=60 一起贴进后续请求。后续请求只放会话号本身更干净。",
            "Require 了对方没有的扩展，得到 551，播放被自己拦住。",
            "User-Agent 里带了换行。头部注入会把一条请求拆成两段。",
            "Range 写成 clock= 的绝对时间，但这条 URL 是直播。直播更常见的是 npt=0.000- 。不支持的范围是 457 Invalid Range。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "SETUP 已返回 200 和 Session，PLAY 还没发。会话处在哪个状态？",
      choices: ["Init", "Ready", "Playing", "Paused"],
      answer: 1,
      explain: "传输已经建立，媒体还没开始送。这就是 Ready。PLAY 的 200 才会把它带进 Playing。",
    },
    {
      prompt: "后续的 TEARDOWN 应该怎样处理会话号 A91B;timeout=60？",
      choices: [
        "Session: A91B;timeout=60，而且把 A91B 转成十进制",
        "Session 头里写 A91B 这个不透明字符串",
        "不再带 Session，因为 SETUP 已经带过",
        "把 timeout 改成 0 表示立即关闭",
      ],
      answer: 1,
      explain: "会话号是不透明字符串。timeout 是 SETUP 应答给你的提示，不是让你在 TEARDOWN 里回写的命令。",
    },
    {
      prompt: "客户端写了 Require: com.example.fancy，摄像机不认识这个功能。预期状态码是？",
      choices: ["200", "401", "551", "404"],
      answer: 2,
      explain: "551 Option not supported 专门回答不认识的 Require。401 是鉴权，404 是路径。",
    },
  ],
};
