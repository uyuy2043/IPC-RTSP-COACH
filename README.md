# RTSP 教练台

这是一个在浏览器里使用的中文 RTSP 学习台，外加一个最小的 Python 教学客户端 `lab/rtsp_miniclient.py`。网页先做 7 题摸底，再按你的基础排出分阶段路线，一次只打开一课。课程覆盖 RTSP 1.0（RFC 2326）、SDP、RTP 与 H.264 的 FU-A / STAP-A、TCP 交织、Digest 鉴权、海康 / 大华 / 宇视的直播路径、Wireshark、FFmpeg / VLC / GStreamer / OpenCV、会话保活、常见状态码，以及 RTSPS 和 SRTP 的差别。

更细的学习路径、每天怎么学、以及实验脚本的检查项，写在 [docs/使用说明.md](docs/使用说明.md)。

## 环境

- Node.js 18.18 或更新版本，以及 npm
- Python 3。教学客户端只用标准库，不需要额外安装包

## 安装并启动网页

在项目根目录执行：

```bash
npm install
npm run dev -- --port 43123 --hostname 0.0.0.0
```

然后在浏览器打开 [http://127.0.0.1:43123](http://127.0.0.1:43123)。

## 怎么用

1. **摸底（7 题）**：系统与语言、TCP/UDP/HTTP 与抓包、RTP/SDP/ONVIF、摄像机品牌型号和地址、已安装的工具、学习目标、每天能学的分钟数。第 7 题结束后点「生成我的路线」。
2. **路线**：网络或抓包还没上手时，会从阶段 0 开始；已经有底子时，阶段 0 不排进路线。一次只能打开当前未完成的那一课，后面的课保持锁定。
3. **一课一课学**：每课末尾有 3 道题。三题都选对并提交之后，「我学完了，继续」才会打开下一模块。答错可以看解析、改选项，再重新提交。
4. **进度**：记在这台浏览器的 `localStorage`，键名是 `rtsp-coach-v1`。换浏览器或清除站点数据后，进度不会跟着走。页头的「重新评估」会清空这份进度并回到第 1 题。

## 教学客户端

`lab/rtsp_miniclient.py` 是一个最小的 RTSP 1.0 客户端。自测不连网：

```bash
python3 lab/rtsp_miniclient.py --self-test
```

通过时打印 `self-test ok`。现场模式只连你有权访问的摄像机，依次做 OPTIONS、DESCRIBE、TCP 交织的 SETUP、PLAY、读取 RTP，然后 TEARDOWN：

```bash
python3 lab/rtsp_miniclient.py --url "rtsp://user:pass@192.168.1.64:554/Streaming/Channels/101" --seconds 3
```

`--seconds` 是 PLAY 成功后继续读取 RTP 的秒数，默认 3。程序打印地址时会把口令打成 `***`。

## 安全

只连接你拥有，或被明确授权访问的摄像机。教学示例地址不能拿去扫描或试探别人的设备。

口令写在 URL 里时，会出现在进程列表（例如 `ps`）和 shell 历史里。笔记、命令历史和截图里不要保留口令。网页摸底里填写的 RTSP 地址会随进度一起存在这台浏览器的 `localStorage` 中。
