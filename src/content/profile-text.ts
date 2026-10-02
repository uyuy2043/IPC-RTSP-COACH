import type { Brand, DailyMinutes, Goal, LanguageChoice, OsChoice, Profile, ToolChoice } from "./model";

const osLabel: Record<OsChoice, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  mixed: "多系统",
};

const languageLabel: Record<LanguageChoice, string> = {
  python: "Python",
  cpp: "C/C++",
  go: "Go",
  java: "Java",
  other: "其他语言",
};

const toolLabel: Record<ToolChoice, string> = {
  wireshark: "Wireshark",
  ffmpeg: "FFmpeg",
  vlc: "VLC",
  gstreamer: "GStreamer",
};

const brandLabel: Record<Brand, string> = {
  hikvision: "海康威视",
  dahua: "大华",
  uniview: "宇视",
  other: "其他品牌",
  unknown: "品牌未定",
  none: "暂无设备",
};

const goalLabel: Record<Goal, string> = {
  capture: "抓包分析",
  debug: "排障",
  client: "写拉流客户端",
  platform: "平台接入",
  develop: "二次开发",
  all: "抓包、排障、客户端和接入都要",
};

const networkLabel: Record<Profile["network"], string> = {
  new: "网络刚入门",
  some: "知道 TCP/UDP 和 HTTP 的大致差别",
  ok: "能自己抓 HTTP",
  strong: "经常分析应用协议",
};

const sampleByBrand: Record<Brand, string> = {
  hikvision: "rtsp://user:pass@192.168.1.64:554/Streaming/Channels/101",
  dahua: "rtsp://user:pass@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0",
  uniview: "rtsp://user:pass@192.168.1.88:554/unicast/c1/s0/live",
  other: "rtsp://user:pass@192.168.1.64:554/stream1",
  unknown: "rtsp://user:pass@192.168.1.64:554/stream1",
  none: "rtsp://127.0.0.1:8554/demo",
};

export function brandName(brand: Brand): string {
  return brandLabel[brand];
}

export function goalName(goal: Goal): string {
  return goalLabel[goal];
}

export function osName(os: OsChoice): string {
  return osLabel[os];
}

export function sampleUrl(profile: Profile): { url: string; assumed: boolean } {
  const typed = profile.rtspUrl.trim();
  if (profile.knowsUrl && typed) return { url: typed, assumed: false };
  return { url: sampleByBrand[profile.brand], assumed: true };
}

export function hostOf(url: string): string {
  const match = url.match(/rtsp:\/\/(?:[^@/]+@)?([^/:]+)/i);
  return match?.[1] ?? "192.168.1.64";
}

export function languageSummary(profile: Profile): string {
  const names = profile.languages.map((item) =>
    item === "other" && profile.languageNote.trim()
      ? profile.languageNote.trim()
      : languageLabel[item],
  );
  return names.join("、") || "还没选定语言";
}

export function fill(text: string, profile: Profile): string {
  const sample = sampleUrl(profile);
  const map: Record<string, string> = {
    "{{url}}": sample.url,
    "{{host}}": hostOf(sample.url),
    "{{urlNote}}": sample.assumed
      ? "下面的地址是教学示例，不是你的摄像机。只替换成你有权访问的设备，或本机测试流。"
      : "下面使用你留下的 RTSP 地址。确认这台设备你有权访问，再抓包、再拉流。",
    "{{brand}}": brandName(profile.brand),
    "{{model}}": profile.model.trim() || "未填型号",
    "{{os}}": osName(profile.os),
    "{{daily}}": String(profile.daily),
    "{{lang}}": languageSummary(profile),
    "{{goal}}": goalName(profile.goal),
    "{{network}}": networkLabel[profile.network],
  };
  return text.replace(
    /\{\{(url|host|urlNote|brand|model|os|daily|lang|goal|network)\}\}/g,
    (token) => map[token] ?? token,
  );
}

export function toolSummary(profile: Profile): string {
  if (profile.tools.length === 0) return "Wireshark、FFmpeg、VLC、GStreamer 都还没装";
  return profile.tools.map((tool) => toolLabel[tool]).join("、");
}

export function installHints(profile: Profile): string[] {
  const missing: ToolChoice[] = (
    ["wireshark", "ffmpeg", "vlc", "gstreamer"] as ToolChoice[]
  ).filter((tool) => !profile.tools.includes(tool));
  if (missing.length === 0) {
    return ["你勾过的工具已经够开始。缺的命令出现时再补，不必一次装齐。"];
  }
  const names = missing.map((tool) => toolLabel[tool]).join("、");
  if (profile.os === "windows") {
    return [
      `还缺 ${names}。Windows 可用 winget：Wireshark.Wireshark、Gyan.FFmpeg、VideoLAN.VLC、GStreamer.GStreamer。`,
      "装好后新开一个终端，让 ffmpeg 和 ffprobe 进入 PATH。",
    ];
  }
  if (profile.os === "macos") {
    return [
      `还缺 ${names}。macOS 可用 Homebrew：brew install wireshark ffmpeg vlc gstreamer。`,
      "Wireshark 抓本机流量时，按安装器提示给捕获权限。",
    ];
  }
  return [
    `还缺 ${names}。Debian/Ubuntu 可用：sudo apt install wireshark ffmpeg vlc gstreamer1.0-tools gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-libav。`,
    "把当前用户加入 wireshark 组后重新登录，才能免 root 抓包。",
  ];
}

const emphasisByGoal: Record<Goal, string[]> = {
  capture: ["place", "sdp", "rtp", "wireshark"],
  debug: ["transport", "auth", "keepalive", "trouble"],
  client: ["methods", "state", "sdp", "rtp", "python"],
  platform: ["place", "auth", "vendors", "security"],
  develop: ["sdp", "rtp", "python", "vendors", "trouble"],
  all: [],
};

export function isEmphasis(goal: Goal, lessonId: string): boolean {
  return emphasisByGoal[goal].includes(lessonId);
}

export function sessionsFor(minutes: number, daily: DailyMinutes): number {
  return Math.max(1, Math.ceil(minutes / daily));
}
