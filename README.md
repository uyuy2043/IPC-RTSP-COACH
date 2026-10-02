# RTSP 教练台

这是一个在浏览器里使用的中文 RTSP 学习台。它先问 7 个问题：系统与语言、TCP/UDP/HTTP 与抓包、RTP/SDP/ONVIF、摄像机品牌型号和地址、已安装的工具、学习目标、每天能学的分钟数。答完之后给出分阶段路线，一次只打开一课。每课末尾有 3 道题，提交并通过之后，「我学完了，继续」才会打开下一模块。进度记在这台浏览器的 `localStorage`，键名是 `rtsp-coach-v1`。

课程覆盖 RTSP 1.0（RFC 2326）、SDP、RTP 与 H.264 的 FU-A / STAP-A、TCP 交织、Digest 鉴权、海康 / 大华 / 宇视的直播路径、Wireshark、FFmpeg / VLC / GStreamer / OpenCV、会话保活、常见状态码，以及 RTSPS 和 SRTP 的差别。

## 启动网页

```bash
npm run dev -- --port 43123 --hostname 0.0.0.0
```

然后在浏览器打开 `http://127.0.0.1:43123`。

## 教学客户端自测

`lab/rtsp_miniclient.py` 是一个最小的 RTSP 1.0 客户端。自测不连网，检查 Digest 测试向量、打红口令、控制地址拼接、RTP 头、SDP、海康通道 3 子码流路径 `302`，以及 Session 超时。

```bash
python3 lab/rtsp_miniclient.py --self-test
```

现场模式会做 OPTIONS、DESCRIBE、TCP 交织的 SETUP、PLAY、读取 RTP 和 TEARDOWN：

```bash
python3 lab/rtsp_miniclient.py --url "rtsp://user:pass@192.168.1.64:554/Streaming/Channels/101" --seconds 3
```

只连接你拥有或被明确授权的摄像机。不要用这个程序去扫描或试探别人的设备。笔记和命令历史里不要保留口令，程序打印地址时会把口令打成 `***`。
