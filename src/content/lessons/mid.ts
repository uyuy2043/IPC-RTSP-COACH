import type { Lesson } from "../model";

export const sdp: Lesson = {
  id: "sdp",
  phase: "阶段 4",
  title: "SDP 说明书",
  objective:
    "能逐行读懂 DESCRIBE 带回的 SDP，指出哪一路是 H.264，并把 a=control 拼成 SETUP 要用的绝对地址。",
  minutes: 50,
  coreTopics: [
    "v、o、s、c、t、m 各行的职责",
    "a=rtpmap 与 a=fmtp 里的 H.264 参数",
    "a=control 相对 Content-Base 的拼接",
  ],
  practice: [
    "盖住右侧注释，点开这一节的 SDP，自己先说出每一行。",
    "对 {{url}} 做一次 DESCRIBE，把 Content-Base 和每一条 a=control 抄在一起。",
    "只 SETUP 视频那一路，确认请求 URI 是绝对地址，而不是单独的 trackID=1。",
  ],
  acceptance: [
    "能说明 m= 行里的端口 0 并不表示端口真是 0，端口要到 SETUP 才谈定。",
    "能区分 packetization-mode 0 和 1，并说出 1 才允许 FU-A。",
    "能处理三种 control：星号、相对路径、绝对 rtsp 地址。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "SDP 是会话描述协议，Session Description Protocol，RFC 4566 规定了它的行格式。RTSP 不重新发明这份说明书，只是在 DESCRIBE 的正文里把它带回来。一行一个字段，字段名只有一个字母，等号两边没有空格。",
        },
        {
          type: "terms",
          items: [
            {
              zh: "会话级",
              en: "session level",
              text: "第一条 m= 之前的行，描述整次播放：版本、会话名、连接地址。",
            },
            {
              zh: "媒体级",
              en: "media level",
              text: "每一条 m= 开启一路媒体。它后面的 a= 只属于这一路，直到下一条 m=。",
            },
            {
              zh: "动态载荷",
              en: "dynamic payload type",
              text: "96 到 127 的 RTP 载荷号没有全球固定含义。96 是不是 H.264，只能看同一路里的 a=rtpmap。",
            },
            {
              zh: "控制地址",
              en: "a=control",
              text: "SETUP 要打到的那一路。它可能是 *，可能是 trackID=1 这种相对路径，也可能是完整的 rtsp:// 地址。",
            },
          ],
        },
        {
          type: "callout",
          tone: "note",
          title: "先分清两份文档",
          text: "RFC 4566 管 SDP 怎么写。RTSP 1.0 的 RFC 2326 附录 C 规定 a=control 在 RTSP 里怎么用。只背行格式、不看 control，就还不能发 SETUP。",
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "table",
          caption: "这一课要认的行",
          headers: ["行", "例子", "你要拿走的信息"],
          rows: [
            ["v=", "v=0", "SDP 版本，IPC 上就是 0"],
            ["o=", "o=- 0 0 IN IP4 0.0.0.0", "发起者。摄像机常把用户名写成 -，数字也常是 0"],
            ["s=", "s=Media Presentation", "会话名，播放器用得少"],
            ["c=", "c=IN IP4 0.0.0.0", "连接地址。0.0.0.0 表示等 SETUP 再定"],
            ["t=", "t=0 0", "起止时间。两个 0 表示直播，不是点播文件的时间窗"],
            ["m=", "m=video 0 RTP/AVP 96", "类型、端口、传输、载荷号。端口 0 同样等 SETUP"],
            ["a=rtpmap", "a=rtpmap:96 H264/90000", "96 号载荷是 H.264，RTP 时钟 90000"],
            ["a=fmtp", "a=fmtp:96 packetization-mode=1;...", "打包方式和 SPS/PPS"],
            ["a=control", "a=control:trackID=1", "这一路的 SETUP 地址"],
          ],
        },
        {
          type: "p",
          text: "m= 行的四个部分是：媒体类型、端口、传输协议、载荷号列表。RTP/AVP 表示 RTP 跑在 UDP 的音视频配置上，这是 SDP 的习惯写法。真正改走 TCP 交织，是 SETUP 的 Transport 头说了算，不是把这里改成 TCP。",
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "p",
          text: "下面这份是 {{brand}} 这类设备上很常见的直播 SDP，型号 {{model}} 的细节会有差别。点每一行看它为什么在这里。{{urlNote}}",
        },
        {
          type: "sdp",
          caption: "DESCRIBE 正文。点一行，读这一行。",
          lines: [
            { text: "v=0", note: "版本行。不是 RTSP 的版本，SDP 自己的版本一直是 0。" },
            {
              text: "o=- 0 0 IN IP4 {{host}}",
              note: "o= 是 origin。减号表示没有用户名。后面两个 0 是会话号和版本号，很多固件不认真填。IN IP4 表示互联网、IPv4。",
            },
            { text: "s=Media Presentation", note: "会话名。海康常见这句话，大华、宇视可能写成 Media Server 或空的 Play。" },
            {
              text: "c=IN IP4 0.0.0.0",
              note: "连接地址写成 0.0.0.0，是在说：别用这一行当目的地。单播地址由 SETUP 的 Transport 决定。",
            },
            { text: "t=0 0", note: "开始和结束都是 0，表示这是一场没有时间窗的直播，不是一个有时长的文件。" },
            {
              text: "a=control:*",
              note: "会话级的星号表示：要操作整路表现时，用 DESCRIBE 那个表现地址本身。PLAY 和 TEARDOWN 通常打在这里，而不是打在某一条 track 上。",
            },
            {
              text: "m=video 0 RTP/AVP 96",
              note: "视频，端口 0，协议 RTP/AVP，载荷号 96。从这一行起进入视频媒体级。端口 0 不是让你往 0 端口发包。",
            },
            {
              text: "a=rtpmap:96 H264/90000",
              note: "96 号是 H.264。90000 是 RTP 时间戳的时钟频率，不是帧率。25 帧时，相邻帧的时间戳大约差 3600。",
            },
            {
              text: "a=fmtp:96 packetization-mode=1;profile-level-id=42001F;sprop-parameter-sets=Z0IAH5WoFAFuQA==,aM48gA==",
              note: "packetization-mode=1 是非交织模式，允许单 NAL、STAP-A 和 FU-A。profile-level-id 的 42 是 Baseline，1F 是 Level 3.1。sprop-parameter-sets 是 Base64 的 SPS 和 PPS，用逗号分开。",
            },
            {
              text: "a=control:trackID=1",
              note: "相对控制地址。若 Content-Base 是 rtsp://{{host}}:554/Streaming/Channels/101/ ，SETUP 的 URI 就是这个基准再加上 trackID=1。",
            },
            {
              text: "m=audio 0 RTP/AVP 8",
              note: "第二路媒体开始。8 是静态载荷，G.711 A-law，所以有时甚至不写 rtpmap。预览客户端可以先不 SETUP 这一路。",
            },
            { text: "a=rtpmap:8 PCMA/8000", note: "明确写成 PCMA，时钟 8000。这是音频，不要拿 90000 去解释它的时间戳。" },
            {
              text: "a=control:trackID=2",
              note: "音频自己的控制地址。视频和音频各发一次 SETUP，Transport 里的 interleaved 要用不同的通道对，例如 0-1 和 2-3。",
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
          headers: ["过滤表达式", "你想确认的事"],
          rows: [
            ["rtsp.method == \"DESCRIBE\" && rtsp.status == 200", "说明书是否真的回来了"],
            ["sdp", "Wireshark 已把正文认成 SDP"],
            ["sdp.media.proto", "这一路写的是不是 RTP/AVP"],
          ],
        },
        {
          type: "ol",
          items: [
            "点开 DESCRIBE 的 200，先读 Content-Type 是不是 application/sdp，再读 Content-Base。",
            "展开 Message Body。媒体级的 a=control 会缩进在对应的 m= 下面。",
            "若正文是乱码或长度和 Content-Length 对不上，先别解读编码，先看这条应答是不是被截断了。",
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
          title: "只把 SDP 打出来",
          code: "ffprobe -rtsp_transport tcp -v debug -show_streams \"{{url}}\"",
        },
        {
          type: "p",
          text: "在 debug 日志里搜索 Content-Base 和 a=control。ffprobe 打印的流信息是它消化过的，排障时仍以原始 SDP 行为准。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "p",
          text: "用 {{lang}} 写客户端之前，先把控制地址的三种形态写死。星号用基准本身，带 :// 的绝对地址原样使用，其余按基准拼接。",
        },
        {
          type: "code",
          title: "把 a=control 变成 SETUP 的 URI",
          code: "def resolve_control(base: str, control: str) -> str:\n    control = control.strip()\n    if control == \"*\":\n        return base\n    if \"://\" in control:\n        return control\n    if base.endswith(\"/\"):\n        return base + control\n    slash = base.rfind(\"/\")\n    return base[: slash + 1] + control\n",
        },
        {
          type: "callout",
          tone: "tip",
          title: "基准从哪来",
          text: "优先用 DESCRIBE 应答的 Content-Base。没有这个头时，用你发出去的那条请求 URI。很多摄像机的 Content-Base 以斜杠结尾，相对的 trackID 才能接在通道号后面。",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "table",
          headers: ["品牌", "SDP 里常见的差别"],
          rows: [
            ["海康威视", "s= 常为 Media Presentation。视频 control 常见 trackID=1，音频 trackID=2。H.265 时 rtpmap 写成 H265/90000"],
            ["大华", "有的固件把 control 写成绝对地址，有的仍是 trackID=0 这种相对路径。以抓到的文本为准，不要写死 1"],
            ["宇视", "路径本身就和另两家不同，control 也可能是 video、track0。先解析，再 SETUP"],
          ],
        },
        {
          type: "p",
          text: "你现在的设备是 {{brand}}，型号 {{model}}。教学示例地址是 {{url}}。H.265 的 fmtp 会变成 sprop-vps、sprop-sps、sprop-pps，打包类型仍要单独看，不要把 H.264 的 packetization-mode 直接套过去。",
        },
      ],
    },
    {
      id: "pitfalls",
      blocks: [
        {
          type: "ul",
          items: [
            "把 m= 行的 0 端口当成目的端口，UDP 发到了错误的地方。",
            "看见载荷号 96 就当 H.264。另一路设备完全可以把 96 留给 H.265。",
            "SETUP 打在会话级的星号上，却以为自己已经选定了视频。星号是整路表现，媒体级 control 才是这一路。",
            "Content-Base 没有斜杠时，把 trackID 直接粘到通道号末尾，变成 101trackID=1。",
            "只拷贝 sprop-parameter-sets 就以为可以解码。它能帮助解码器起步，帧数据仍然在 RTP 里。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "m=video 0 RTP/AVP 96 里的 0 表示什么？",
      choices: [
        "视频从 UDP 0 端口发送",
        "这路媒体的端口留到 SETUP 再决定",
        "载荷号是 0",
        "没有视频",
      ],
      answer: 1,
      explain: "直播 SDP 里端口 0 和连接地址 0.0.0.0 都是占位。单播端口写在 SETUP 的 Transport 应答里。",
    },
    {
      prompt: "packetization-mode=1 对 H.264 意味着什么？",
      choices: [
        "只能一个 RTP 包装一个完整 NAL",
        "非交织模式，可以出现 STAP-A 和 FU-A",
        "必须改走 TCP",
        "这是 H.265 专用参数",
      ],
      answer: 1,
      explain: "模式 0 才是单 NAL。模式 1 是 IPC 上最常见的非交织打包，允许把大 NAL 拆成 FU-A，把小 NAL 合成 STAP-A。模式 2 的交织在摄像机上很少见。",
    },
    {
      prompt: "Content-Base 为 rtsp://192.168.1.64:554/Streaming/Channels/101/ ，a=control 为 trackID=1。SETUP 应该发往哪？",
      choices: [
        "rtsp://192.168.1.64:554/trackID=1",
        "rtsp://192.168.1.64:554/Streaming/Channels/101/trackID=1",
        "只写 trackID=1，不带主机",
        "rtsp://192.168.1.64:554/Streaming/Channels/trackID=1",
      ],
      answer: 1,
      explain: "相对 control 接在 Content-Base 后面。基准以斜杠结尾时，通道号 101 会留在路径里。",
    },
  ],
};

export const rtp: Lesson = {
  id: "rtp",
  phase: "阶段 5",
  title: "RTP 与 H.264 的 FU-A / STAP-A",
  objective:
    "能从 RTP 头读出版本、序列号、时间戳和 Marker，并能判断一个 H.264 包是单个 NAL、FU-A 还是 STAP-A。",
  minutes: 55,
  coreTopics: ["12 字节 RTP 头", "同一帧的时间戳和 Marker", "FU-A 分片与 STAP-A 聚合"],
  practice: [
    "点开这一节的包表，先看序列号是否连续，再看哪个包把 Marker 置上了。",
    "拿一个以 0x7C 开头的载荷，指出 FU indicator 和 FU header，并说出 S、E 位。",
    "解释为什么 SPS 和 PPS 经常被打进同一个 STAP-A，而一个 I 帧却要拆成多个 FU-A。",
  ],
  acceptance: [
    "能默写 RTP 头里序列号、时间戳、SSRC 的位置和字节数。",
    "能说明 90000 时钟下，25 fps 时相邻帧时间戳大约差 3600。",
    "能画出 FU-A 的开始包、中间包和结束包。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "RTP 是实时传输协议，RFC 3550。它不认识 H.264，只提供序列号、时间戳和同步源。H.264 怎么切进这些包，由 RFC 6184 规定。RTSP 把会话谈成之后，你接下来看到的二进制就是 RTP。",
        },
        {
          type: "terms",
          items: [
            { zh: "序列号", en: "sequence number", text: "每发一个 RTP 包加 1，16 位，到 65535 后回到 0。用它发现丢包，不要用它判断帧边界。" },
            { zh: "时间戳", en: "timestamp", text: "同一帧的所有分片共用一个时间戳。H.264 视频的时钟几乎总是 90000。" },
            { zh: "标记位", en: "marker", text: "视频里通常表示这一帧的最后一个包。FU-A 只有结束那个分片会把 Marker 置 1。" },
            { zh: "同步源", en: "SSRC", text: "32 位标识，区分这一路 RTP 流。它不是会话号，也不是通道号。" },
            { zh: "网络抽象层单元", en: "NAL unit", text: "H.264 的传输单位。SPS、PPS、IDR 片、普通片都是 NAL。RTP 载荷里装的就是它们或它们的碎片。" },
          ],
        },
        {
          type: "table",
          caption: "RTP 固定头，共 12 字节，后面才是载荷",
          headers: ["字段", "宽度", "直播里怎么读"],
          rows: [
            ["V", "2 bit", "必须是 2。不是 2 就还没对齐到 RTP 头"],
            ["P X CC", "1+1+4 bit", "填充、扩展、CSRC 个数。IPC 预览常见全 0"],
            ["M 和 PT", "1+7 bit", "Marker，以及载荷号。载荷号要和 SDP 的 rtpmap 对上"],
            ["sequence", "16 bit", "网络字节序。相邻包通常差 1"],
            ["timestamp", "32 bit", "网络字节序。同一帧保持不变"],
            ["SSRC", "32 bit", "这一路的身份。中途变化通常表示流被重建了"],
          ],
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "p",
          text: "H.264 载荷的第一个字节是 NAL 头。低 5 位是类型。1 到 23 是单个 NAL，可以直接送给解码器。24 是 STAP-A。28 是 FU-A。摄像机上最常见的就是这三类。",
        },
        {
          type: "table",
          caption: "RFC 6184 里和 IPC 有关的类型",
          headers: ["类型", "名字", "什么时候出现"],
          rows: [
            ["1", "非 IDR 片", "普通 P 帧或 B 帧的一整片，小到能放进一个包"],
            ["5", "IDR 片", "关键帧。丢了它，后面的片都得等下一个 IDR"],
            ["7 / 8", "SPS / PPS", "解码参数。常被聚合，也会在关键帧前单独出现"],
            ["24", "STAP-A", "一个包里按顺序放多个小 NAL，每个前面有 16 位长度"],
            ["28", "FU-A", "一个大 NAL 拆成多片。有开始位 S 和结束位 E"],
          ],
        },
        {
          type: "code",
          title: "FU-A 比单个 NAL 多一个分片头",
          code: "FU indicator: F | NRI | Type=28\nFU header:    S | E | R | 原始 NAL 类型\n然后才是这一片的 NAL 正文",
        },
        {
          type: "ul",
          items: [
            "S=1 且 E=0：这一帧这个 NAL 的第一片。原始类型在 FU header 的低 5 位，常见是 5 或 1。",
            "S=0 且 E=0：中间片。时间戳与第一片相同，序列号继续加 1。",
            "S=0 且 E=1：最后一片。视频 Marker 通常也在这个包上置 1。",
            "S 和 E 都是 1 没有意义，一个不需要分片的 NAL 应该直接用类型 1 到 23。",
          ],
        },
        {
          type: "p",
          text: "STAP-A 的第一个字节类型是 24，后面重复出现「2 字节长度 + 一个完整 NAL」。SPS 跟着 PPS 是最常见的组合。把长度当内容送给解码器，画面会立刻解不开。",
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "packets",
          caption: "同一台 {{host}} 上的四秒摘录。点一行看这个包在帧里的位置。",
          rows: [
            {
              no: "18",
              time: "0.000",
              src: "{{host}}",
              dst: "客户端",
              proto: "RTP",
              info: "PT=96 Seq=18421 M=0 TS=305419896",
              detail: "载荷以 0x67 开头，类型 7，这是一个完整的 SPS。序列号 18421 应和 PLAY 应答里 RTP-Info 的 seq 对得上。时间戳 305419896 是这一帧的起点。",
            },
            {
              no: "19",
              time: "0.001",
              src: "{{host}}",
              dst: "客户端",
              proto: "RTP",
              info: "PT=96 Seq=18422 M=0 STAP-A",
              detail: "第一个字节类型 24。包里先是 2 字节长度，再是 SPS，然后又一个长度和 PPS。小参数不值得各占一个包，所以用 STAP-A 聚合。",
            },
            {
              no: "20",
              time: "0.004",
              src: "{{host}}",
              dst: "客户端",
              proto: "RTP",
              info: "PT=96 Seq=18423 M=0 FU-A S=1",
              detail: "0x7C 是 FU indicator，NRI 沿用关键片，类型 28。下一个字节 S=1、E=0，原始类型 5，说明一个 IDR 开始被拆开。时间戳仍是 305419896。",
            },
            {
              no: "21",
              time: "0.005",
              src: "{{host}}",
              dst: "客户端",
              proto: "RTP",
              info: "PT=96 Seq=18424 M=1 FU-A E=1",
              detail: "S=0、E=1，这是 IDR 的最后一片，Marker 置 1。下一帧的时间戳会增加。25 fps 时增加约 3600，30 fps 时增加约 3000。",
            },
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "先对齐，再谈花屏",
          text: "PLAY 应答的 RTP-Info 给出 seq 和 rtptime。第一个视频包的序列号和时间戳应该从那里接上。对不上时，先怀疑看错了 SSRC，而不是解码器坏了。",
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
            ["rtp", "只留 RTP。TCP 交织时要先让 Wireshark 从 RTSP 里解出 RTP"],
            ["rtp.marker == 1", "只看每一帧的最后一个包"],
            ["rtp.ssrc == 0x9a3f22b1", "只看这一路，数字换成你抓到的 SSRC"],
            ["rtcp", "接收报告和发送者报告，不是第二路画面"],
          ],
        },
        {
          type: "p",
          text: "在 RTP 包的载荷部分看第一个字节。0x67 这类小于 24 的类型是整 NAL，0x78 到 0x7C 这一带要按 FU-A 继续看第二个字节。Wireshark 的 H264 解码器会标出 NAL unit type，仍然建议你自己核对低 5 位。",
        },
      ],
    },
    {
      id: "commands",
      blocks: [
        { type: "callout", tone: "warn", text: "{{urlNote}}" },
        {
          type: "code",
          title: "把大约三秒的视频直接拷进文件，顺便看它认不认 H.264",
          code: "ffmpeg -rtsp_transport tcp -i \"{{url}}\" -t 3 -c copy -an clip.mp4",
        },
        {
          type: "p",
          text: "-c copy 不重新编码，所以 FU-A 的组装是 FFmpeg 做的。若这里成功而你自己的客户端花屏，问题多半在分片拼接，不在摄像机。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "code",
          title: "读 12 字节 RTP 头，并认出 FU-A",
          code: "def parse_rtp(packet: bytes) -> dict:\n    if len(packet) < 12:\n        raise ValueError(\"RTP 头至少 12 字节\")\n    marker = (packet[1] >> 7) & 1\n    payload_type = packet[1] & 0x7F\n    sequence = (packet[2] << 8) | packet[3]\n    timestamp = int.from_bytes(packet[4:8], \"big\")\n    ssrc = int.from_bytes(packet[8:12], \"big\")\n    cc = packet[0] & 0x0F\n    payload = packet[12 + 4 * cc :]\n    nal_type = payload[0] & 0x1F if payload else None\n    return {\n        \"marker\": marker,\n        \"payload_type\": payload_type,\n        \"sequence\": sequence,\n        \"timestamp\": timestamp,\n        \"ssrc\": ssrc,\n        \"nal_type\": nal_type,\n    }\n",
        },
        {
          type: "p",
          text: "nal_type 为 28 时再读 payload[1]：最高位是 S，次高位是 E，低 5 位才是原始 NAL 类型。拼接时丢掉 FU indicator 和 FU header，按原始类型重建一个 NAL 头，再把各片正文接起来。",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "table",
          headers: ["品牌", "RTP 上常见的习惯"],
          rows: [
            ["海康威视", "主码流包很大，IDR 几乎一定是 FU-A。SPS/PPS 可能在 STAP-A，也可能紧挨在 IDR 前面单独发送"],
            ["大华", "同样以 packetization-mode=1 为主。音频若是 PCMA，载荷号 8，不要和视频的 96 混在一个解码器里"],
            ["宇视", "有的固件每个 IDR 前都重发参数集。参数集重复不是错误，丢掉以外的重复即可"],
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
            "用序列号划分帧。帧边界看时间戳和 Marker，序列号只负责顺序和丢包。",
            "FU-A 的每一片都把类型 28 送给解码器。解码器要的是 FU header 里的原始类型。",
            "STAP-A 忘记读 16 位长度，把下一颗 NAL 的头当成像素数据。",
            "时间戳单位当成毫秒。90000 分之一秒才是视频 RTP 的一格。",
            "Marker 丢了就认为整帧报废。Marker 是提示，时间戳变化同样说明上一帧结束。两者一起看更稳。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "同一帧被拆成 3 个 FU-A。哪一项是对的？",
      choices: [
        "三个包时间戳不同，序列号相同",
        "三个包时间戳相同，序列号递增，只有最后一片 Marker 为 1",
        "三个包的 NAL 类型都应该是 5",
        "只有第一片需要 RTP 头",
      ],
      answer: 1,
      explain: "分片共享时间戳，序列号逐包加 1。Marker 标在这一帧最后一个 RTP 包上。线上的类型是 28，原始类型藏在 FU header 里。",
    },
    {
      prompt: "载荷第一个字节的低 5 位是 24。这是什么？",
      choices: ["FU-A 的一片", "STAP-A，后面是带 16 位长度的多个 NAL", "RTP 填充", "RTCP 发送者报告"],
      answer: 1,
      explain: "24 是 STAP-A。28 才是 FU-A。STAP-A 里每个小 NAL 前面都有一个 16 位的长度。",
    },
    {
      prompt: "H.264 的 RTP 时钟是 90000，帧率 25。相邻两帧的时间戳通常差多少？",
      choices: ["25", "40", "90000", "3600"],
      answer: 3,
      explain: "90000 / 25 = 3600。差 40 的是毫秒间隔，不要和 RTP 时间戳混用。",
    },
  ],
};

export const transport: Lesson = {
  id: "transport",
  phase: "阶段 6",
  title: "UDP 单播和 TCP 交织",
  objective:
    "能为 SETUP 写出一条 UDP 或 TCP 交织的 Transport 头，并解释应答里的端口或通道才是最终结果。",
  minutes: 50,
  coreTopics: ["client_port 与 server_port", "interleaved 通道对", "美元符号交织帧"],
  practice: [
    "把这一节的 SETUP 走完，比较两条 Transport 的差别只有传输方式。",
    "在 {{os}} 上对 {{url}} 分别用 UDP 和 TCP 拉 3 秒，记下哪一种先看到画面。",
    "抓一条交织帧，指出 0x24、通道号和 2 字节长度。",
  ],
  acceptance: [
    "能说明偶数通道是 RTP，紧挨的奇数通道是 RTCP。",
    "能解释跨网段时 UDP 更容易没画面，而 RTSP 仍然是 200。",
    "能认出 461 是传输方式没谈成，不是密码错。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "RTSP 负责把传输方式写进 SETUP。谈成之后有两条常用路：RTP 走另一对 UDP 端口，或者 RTP 塞进原来这条 RTSP 的 TCP 连接。第二条路叫交织，interleaved。你的目标是 {{goal}}，无论偏抓包还是偏写客户端，都要会把这两条路分开。",
        },
        {
          type: "terms",
          items: [
            { zh: "单播", en: "unicast", text: "摄像机把包发给这一个客户端。IPC 预览默认如此。multicast 要设备和网络另外打开。" },
            { zh: "客户端端口", en: "client_port", text: "你准备收 RTP 和 RTCP 的 UDP 端口对。偶数收 RTP，奇数收 RTCP。" },
            { zh: "服务器端口", en: "server_port", text: "摄像机实际用来发的端口对。以 SETUP 应答为准，不要猜 554。" },
            { zh: "交织", en: "interleaved", text: "在同一条 TCP 上用 4 字节帧头把 RTP 和 RTSP 文本分开。通道 0 和 1 是第一对。" },
          ],
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "table",
          caption: "Transport 头里要会写、会读的参数",
          headers: ["写法", "方向", "含义"],
          rows: [
            ["RTP/AVP;unicast;client_port=5000-5001", "请求", "请用 UDP，我在 5000 收视频，5001 收 RTCP"],
            ["RTP/AVP;unicast;client_port=5000-5001;server_port=4000-4001", "应答", "摄像机从 4000/4001 发给你。端口以它为准"],
            ["RTP/AVP/TCP;unicast;interleaved=0-1", "请求和应答", "RTP 走通道 0，RTCP 走通道 1，都在这条 TCP 里"],
            ["RTP/AVP/TCP;unicast;interleaved=2-3", "第二路", "音频再占下一对，不要和视频复用 0-1"],
          ],
        },
        {
          type: "code",
          title: "TCP 交织的 4 字节帧头，RFC 2326 第 10.12 节",
          code: "字节 0: 0x24，也就是字符 $\n字节 1: 通道号\n字节 2-3: 后面 RTP 或 RTCP 的长度，16 位网络字节序\n长度不包括这 4 个字节本身",
        },
        {
          type: "callout",
          tone: "note",
          title: "请求是愿望，应答是合同",
          text: "你写 client_port=5000-5001，摄像机可以接受，也可以改用别的方式回答。读应答里的 Transport。若它变成 interleaved，你就不要再去听 UDP。",
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "walk",
          caption: "同一条视频先谈 UDP，再谈 TCP。点每一步，先看发出去的头，再看应答。",
          steps: [
            {
              name: "SETUP UDP",
              send: "SETUP rtsp://{{host}}:554/Streaming/Channels/101/trackID=1 RTSP/1.0\r\nCSeq: 3\r\nTransport: RTP/AVP;unicast;client_port=5000-5001\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 3\r\nSession: 9A3F22B1;timeout=60\r\nTransport: RTP/AVP;unicast;client_port=5000-5001;server_port=4000-4001\r\n\r\n",
              why: "你声明自己的 UDP 端口。应答若是 200，就按 server_port 收包。Session 从这里开始存在。",
            },
            {
              name: "UDP 没画面",
              send: "（RTSP 已经 200，但防火墙上没有返回的 UDP）",
              recv: "RTP 包一个都没到。RTSP 这条 TCP 仍然是通的。",
              why: "控制面成功不等于媒体面成功。摄像机往 5000 端口发了，中间的 NAT 或防火墙把它丢了。这时改走 TCP，而不是再猜密码。",
            },
            {
              name: "SETUP TCP",
              send: "SETUP rtsp://{{host}}:554/Streaming/Channels/101/trackID=1 RTSP/1.0\r\nCSeq: 4\r\nTransport: RTP/AVP/TCP;unicast;interleaved=0-1\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 4\r\nSession: B17C0044;timeout=60\r\nTransport: RTP/AVP/TCP;unicast;interleaved=0-1\r\n\r\n",
              why: "这是新的 SETUP，会得到新的 Session。通道 0 是 RTP，通道 1 是 RTCP。",
            },
            {
              name: "读交织帧",
              send: "PLAY 已经返回 200，开始在同一条 TCP 上读",
              recv: "24 00 00 20 80 e0 47 f5 ...",
              why: "0x24 是帧开始，0x00 是通道 0，0x0020 表示后面 32 字节是一个 RTP 包。下一个字节 0x80 才是 RTP 版本 2。不要把 0x24 当成 RTP 的第一个字节。",
            },
          ],
        },
      ],
    },
    {
      id: "capture",
      blocks: [
        {
          type: "packets",
          caption: "一次改走 TCP 的抓包。点开看 461 和后来的交织帧有什么不同。",
          rows: [
            {
              no: "40",
              time: "1.102",
              src: "客户端",
              dst: "{{host}}",
              proto: "RTSP",
              info: "SETUP RTP/AVP;unicast;client_port=5000-5001",
              detail: "客户端希望用 UDP。若你和摄像机不在同一网段，这条请求仍会得到应答，因为 RTSP 走的是 TCP 554。",
            },
            {
              no: "41",
              time: "1.110",
              src: "{{host}}",
              dst: "客户端",
              proto: "RTSP",
              info: "RTSP/1.0 461 Unsupported Transport",
              detail: "这台设备或当前配置拒绝了 UDP。461 只说明 Transport 没谈成。会话还停在 Init，不要拿一个不存在的 Session 去 PLAY。",
            },
            {
              no: "44",
              time: "1.240",
              src: "客户端",
              dst: "{{host}}",
              proto: "RTSP",
              info: "SETUP RTP/AVP/TCP;unicast;interleaved=0-1",
              detail: "第二次 SETUP 换成交织。注意 CSeq 已经增加。这是一条新请求，不是把上一条重传。",
            },
            {
              no: "52",
              time: "1.480",
              src: "{{host}}",
              dst: "客户端",
              proto: "TCP",
              info: "$ 通道 0，长度 1400",
              detail: "PLAY 之后，Follow TCP Stream 会突然出现乱码。那是 RTP。用 0x24、通道、长度把它们从 RTSP 文本里切出来，再按 RTP 解析。",
            },
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
          title: "强制 TCP。跨路由时先用这一条",
          code: "ffmpeg -rtsp_transport tcp -i \"{{url}}\" -t 3 -f null -",
        },
        {
          type: "code",
          title: "改回 UDP，用来对照",
          code: "ffmpeg -rtsp_transport udp -i \"{{url}}\" -t 3 -f null -",
        },
        {
          type: "p",
          text: "TCP 有画面、UDP 超时，就可以把原因写成媒体路径被拦，而不是 URL 写错。URL 写错通常在 DESCRIBE 就 404 了。",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "code",
          title: "从 TCP 字节流里切出一个交织帧",
          code: "def pop_interleaved(buf: bytes):\n    if not buf.startswith(b\"$\"):\n        return None\n    if len(buf) < 4:\n        return None\n    channel = buf[1]\n    length = (buf[2] << 8) | buf[3]\n    if len(buf) < 4 + length:\n        return None\n    return channel, buf[4 : 4 + length], buf[4 + length :]\n",
        },
        {
          type: "p",
          text: "buf 里可能先是 RTSP 文本。只有当前字节是 0x24 时才按交织帧切。长度不够就继续 recv，不要把半个 RTP 头交给解析器。",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "table",
          headers: ["品牌", "传输上的习惯"],
          rows: [
            ["海康威视", "UDP 和 TCP 交织一般都开。网页里可以关掉某一项，关掉后 SETUP 得到 461"],
            ["大华", "同样支持两种。NVR 转出来的 RTSP 有时只稳在 TCP"],
            ["宇视", "有的工程只放行 TCP 554，UDP 端口范围没有放行。先 TCP，再决定要不要开 UDP"],
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
            "RTP/AVP/TCP 忘了写 unicast 或 interleaved。有的固件直接 461。",
            "两路媒体都写 interleaved=0-1，音频把视频的通道盖掉。",
            "把交织帧的长度理解成含 4 字节帧头。长度只覆盖后面的 RTP 或 RTCP。",
            "UDP 端口写成奇数在前。约定是偶数 RTP、奇数 RTCP。",
            "PLAY 已经 200 却在文本流里用 decode 解 RTP，碰到 0x24 就抛异常。要先分流。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "interleaved=0-1 里的两个数字是什么？",
      choices: ["UDP 端口 0 和 1", "TCP 连接里的 RTP 通道和 RTCP 通道", "CSeq 的范围", "组播地址的末尾"],
      answer: 1,
      explain: "这是同一条 RTSP TCP 上的通道号。0 走 RTP，1 走 RTCP。端口仍然是原来的 554 或你连上的那个端口。",
    },
    {
      prompt: "DESCRIBE 是 200，SETUP 的 UDP 也是 200，但没有任何画面。哪一步最合适？",
      choices: [
        "把密码再试一遍，因为这是 401",
        "改用 RTP/AVP/TCP;unicast;interleaved=0-1 再 SETUP",
        "把 URL 路径改掉，因为这是 404",
        "发送 RECORD",
      ],
      answer: 1,
      explain: "控制已经成功，失败的是 UDP 媒体路径。TCP 交织让媒体走回已经打通的那条连接。401 和 404 都会在 RTSP 应答里直接出现。",
    },
    {
      prompt: "交织帧 24 00 05 00 后面应该跟着多少字节的 RTP？",
      choices: ["4 字节", "5 字节", "1280 字节", "0 字节，因为通道是 0"],
      answer: 2,
      explain: "0x24 是魔数，0x00 是通道，0x0500 是长度 1280。这 1280 字节才是 RTP，其中前 12 字节是 RTP 头。",
    },
  ],
};

export const auth: Lesson = {
  id: "auth",
  phase: "阶段 7",
  title: "Digest 鉴权",
  objective:
    "能读懂 401 里的 WWW-Authenticate，按 RFC 2617 算出 Digest response，并在下一次请求里带上 Authorization。",
  minutes: 50,
  coreTopics: ["401 与 nonce", "HA1、HA2 和 qop=auth", "用户名放在头里而不是写进日志"],
  practice: [
    "对 {{url}} 先发一条不带鉴权的 DESCRIBE，把 realm 和 nonce 抄下来。",
    "确认应答是 Digest 还是 Basic。两条都有时选 Digest。",
    "用实验向量核对算法：response 应为 6629fae49393a05397450978507c4ef1。",
  ],
  acceptance: [
    "能说明 Digest 没有把密码原样发出去，但也没有加密 SDP 或视频。",
    "能解释 stale=true 是重算，不是让你换密码。",
    "能说出 uri 字段必须和请求行里的 URI 是同一串字符。",
  ],
  sections: [
    {
      id: "concept",
      blocks: [
        {
          type: "p",
          text: "IPC 几乎不让匿名 DESCRIBE。服务器先用 401 抛出一个nonce，客户端用用户名、密码、nonce 和请求 URI 算出一串摘要，下一次把摘要放进 Authorization。这是 HTTP 摘要鉴权，RFC 2617，RTSP 直接沿用，不另做一套密码协议。",
        },
        {
          type: "terms",
          items: [
            { zh: "域", en: "realm", text: "密码所属的名字，摄像机常写成 IPCamera 或设备型号。算摘要时必须用它返回的原文。" },
            { zh: "现时值", en: "nonce", text: "服务器现给的随机串。每次挑战都可能变。把它放进摘要，可以避免同一串 response 永远有效。" },
            { zh: "质量保护", en: "qop=auth", text: "IPC 上常见的保护级别。选了它就要带 nc 和 cnonce。它仍然不加密正文。" },
            { zh: "陈旧", en: "stale", text: "stale=true 表示 nonce 过期，密码可能是对的，按新 nonce 再算一次。" },
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "摘要不是加密",
          text: "Digest 保护的是密码本身，不保护 SDP，也不保护 RTP。同一条网线上，没有 TLS 的人仍然看得到视频。加密是后面的 RTSPS 和 SRTP。",
        },
      ],
    },
    {
      id: "messages",
      blocks: [
        {
          type: "code",
          title: "没有 qop 时的三步，RFC 2617",
          code: "HA1 = MD5(username:realm:password)\nHA2 = MD5(method:digest-uri)\nresponse = MD5(HA1:nonce:HA2)",
        },
        {
          type: "code",
          title: "qop=auth 时多出计数器和客户端现时值",
          code: "response = MD5(HA1:nonce:nc:cnonce:qop:HA2)",
        },
        {
          type: "p",
          text: "公开测试向量可以用来核对实现：用户 Mufasa，realm 为 testrealm@host.com，密码 Circle Of Life，方法 GET，uri 为 /dir/index.html，nonce 为 dcd98b7102dd2f0e8b11d0f600bfb0c093，nc 为 00000001，cnonce 为 0a4f113b，qop 为 auth。response 是 6629fae49393a05397450978507c4ef1。",
        },
        {
          type: "table",
          headers: ["字段", "谁产生", "规则"],
          rows: [
            ["username / realm / nonce", "用户名是你的，realm 和 nonce 从 401 抄", "realm、nonce 不要自己编"],
            ["uri", "客户端", "和请求行里的 URI 逐字符相同，通常不带用户名密码"],
            ["nc", "客户端", "八位十六进制计数，从 00000001 起，每次请求加 1"],
            ["cnonce", "客户端", "你自己的随机串。qop=auth 时必须有"],
            ["response", "客户端", "上面的 MD5，32 位小写十六进制"],
          ],
        },
      ],
    },
    {
      id: "example",
      blocks: [
        {
          type: "walk",
          caption: "先吃一个 401，再带 Digest 重发 DESCRIBE。密码不要写进日志，这里用占位。",
          steps: [
            {
              name: "裸 DESCRIBE",
              send: "DESCRIBE {{url}} RTSP/1.0\r\nCSeq: 2\r\nAccept: application/sdp\r\n\r\n",
              recv: "RTSP/1.0 401 Unauthorized\r\nCSeq: 2\r\nWWW-Authenticate: Digest realm=\"IPCamera\", nonce=\"6b8b4567\", stale=FALSE, qop=\"auth\"\r\n\r\n",
              why: "没有 Authorization 时，401 是正常的第一问，不是故障。把 realm、nonce、qop 存下来。",
            },
            {
              name: "带 Digest 再问",
              send: "DESCRIBE {{url}} RTSP/1.0\r\nCSeq: 3\r\nAccept: application/sdp\r\nAuthorization: Digest username=\"user\", realm=\"IPCamera\", nonce=\"6b8b4567\", uri=\"{{url}}\", response=\"<md5>\", qop=auth, nc=00000001, cnonce=\"0a4f113b\"\r\n\r\n",
              recv: "RTSP/1.0 200 OK\r\nCSeq: 3\r\nContent-Type: application/sdp\r\nContent-Base: {{url}}/\r\n\r\n(SDP)",
              why: "这是一条新请求，CSeq 要加。uri 和请求行相同。随后的 SETUP 和 PLAY 也要带 Authorization，并把 nc 加到 00000002、00000003。",
            },
            {
              name: "nonce 过期",
              send: "PLAY {{url}} RTSP/1.0\r\nCSeq: 8\r\nSession: 9A3F22B1\r\nAuthorization: Digest ... nc=00000006 ...\r\n\r\n",
              recv: "RTSP/1.0 401 Unauthorized\r\nWWW-Authenticate: Digest realm=\"IPCamera\", nonce=\"newnonce\", stale=TRUE\r\n\r\n",
              why: "stale=TRUE 是让你用新 nonce 重算，用户名密码可以不动。若 stale 不是 TRUE 又连续 401，再检查密码、uri 和有没有把用户信息写进了请求行。",
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
          headers: ["过滤表达式", "看什么"],
          rows: [
            ["rtsp.status == 401", "每一次挑战"],
            ["rtsp.auth", "WWW-Authenticate 和 Authorization"],
          ],
        },
        {
          type: "ul",
          items: [
            "展开 WWW-Authenticate，确认方案是 Digest 而不是 Basic。",
            "对比请求行和 Authorization 里的 uri，多一个斜杠或少一个查询参数都会让 response 对不上。",
            "抓包文件里会有用户名和 response。不要把含真实 nonce 的抓包发到公开场合。密码本身不会以明文出现在 Digest 里。",
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
          text: "命令行里的 rtsp://user:pass@主机 会被 FFmpeg 转成 Digest，但密码会出现在进程列表和 shell 历史里。下面这条只适合你自己的机器和 {{host}}。做完用历史清理，日志只留红掉密码的地址。",
        },
        {
          type: "code",
          title: "让 FFmpeg 去完成 401，终端只看状态码",
          code: "ffmpeg -rtsp_transport tcp -loglevel debug -i \"{{url}}\" -t 2 -f null -",
        },
      ],
    },
    {
      id: "code",
      blocks: [
        {
          type: "code",
          title: "按 qop=auth 计算 response",
          code: "import hashlib\n\ndef md5_hex(text: str) -> str:\n    return hashlib.md5(text.encode(\"utf-8\")).hexdigest()\n\ndef digest_response(username, realm, password, method, uri, nonce, nc, cnonce, qop=\"auth\"):\n    ha1 = md5_hex(username + \":\" + realm + \":\" + password)\n    ha2 = md5_hex(method + \":\" + uri)\n    material = \":\".join([ha1, nonce, nc, cnonce, qop, ha2])\n    return md5_hex(material)\n",
        },
        {
          type: "callout",
          tone: "tip",
          text: "实验室里的 rtsp_miniclient.py 用 RFC 2617 的向量自测。先让那一串 response 相等，再去连 {{brand}} 的设备。",
        },
      ],
    },
    {
      id: "vendors",
      blocks: [
        {
          type: "table",
          headers: ["品牌", "鉴权习惯"],
          rows: [
            ["海康威视", "Digest，realm 常含设备信息。用户要有「远程预览」权限，只有网页管理员不一定能拉流"],
            ["大华", "Digest。ONVIF 用户和 RTSP 用户有的固件是分开的开关"],
            ["宇视", "Digest 为主。个别老固件同时广告 Basic，客户端应选 Digest"],
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
            "把 401 当成网络不通。网络不通是超时，401 是应用层已经在说话。",
            "密码里有 @ 或冒号，又把口令塞进 URL。rtsp://user:p@ss@host 会被拆错。这种口令放到 Authorization 的计算里，不要依赖 URL 语法。",
            "uri 用了带用户名的地址，请求行却没有，两处不一致。",
            "qop=auth 却仍用没有 nc、cnonce 的旧公式。",
            "MD5 结果做成大写。比较时服务器要的是小写十六进制。",
            "在打印日志时输出 Authorization 或密码。教学客户端应该把 user:pass@ 红成 user:***@。",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      prompt: "DESCRIBE 收到 401，WWW-Authenticate 是 Digest。下一步是？",
      choices: [
        "立刻 TEARDOWN",
        "用 realm、nonce 和密码算出 response，CSeq 加 1 后重发 DESCRIBE",
        "把密码明文写进一个 Password 头",
        "改走 UDP 就可以跳过鉴权",
      ],
      answer: 1,
      explain: "401 是挑战。下一条是新的请求，所以 CSeq 增加，并带上 Authorization。传输方式和鉴权无关。",
    },
    {
      prompt: "qop=auth 时，response 的材料按什么顺序拼？",
      choices: [
        "HA1:nonce:HA2",
        "HA1:nonce:nc:cnonce:qop:HA2",
        "password:nonce",
        "username:uri:nonce",
      ],
      answer: 1,
      explain: "没有 qop 才是 HA1:nonce:HA2。IPC 给出 qop=auth 时必须把 nc、cnonce 和 qop 放进中间。RFC 2617 的测试向量 response 是 6629fae49393a05397450978507c4ef1。",
    },
    {
      prompt: "第二次 401 里 stale=TRUE。更合理的解释是？",
      choices: [
        "路径不存在",
        "nonce 过期，用新的 nonce 再算一次",
        "Transport 不被支持",
        "Session 还在 Init",
      ],
      answer: 1,
      explain: "stale=TRUE 专门表示挑战过期。路径是 404，传输是 461，状态机错误是 455。",
    },
  ],
};
