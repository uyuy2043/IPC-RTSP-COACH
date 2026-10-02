export type NetworkLevel = "new" | "some" | "ok" | "strong";
export type CaptureLevel = "never" | "watched" | "often";
export type Familiarity = "none" | "name" | "used" | "work";
export type Brand =
  | "hikvision"
  | "dahua"
  | "uniview"
  | "other"
  | "unknown"
  | "none";
export type Goal =
  | "capture"
  | "debug"
  | "client"
  | "platform"
  | "develop"
  | "all";
export type DailyMinutes = 20 | 45 | 90 | 180;
export type OsChoice = "windows" | "macos" | "linux" | "mixed";
export type LanguageChoice = "python" | "cpp" | "go" | "java" | "other";
export type ToolChoice = "wireshark" | "ffmpeg" | "vlc" | "gstreamer";
export type IpcAccess = "yes" | "no" | "borrow";

export type Profile = {
  os: OsChoice;
  languages: LanguageChoice[];
  languageNote: string;
  network: NetworkLevel;
  capture: CaptureLevel;
  rtp: Familiarity;
  sdp: Familiarity;
  onvif: Familiarity;
  hasIpc: IpcAccess;
  brand: Brand;
  model: string;
  rtspUrl: string;
  knowsUrl: boolean;
  tools: ToolChoice[];
  goal: Goal;
  daily: DailyMinutes;
};

export type SequenceStep = {
  from: string;
  to: string;
  title: string;
  detail?: string;
};

export type WalkStep = {
  name: string;
  send: string;
  recv: string;
  why: string;
};

export type SdpLine = {
  text: string;
  note: string;
};

export type PacketRow = {
  no: string;
  time: string;
  src: string;
  dst: string;
  proto: string;
  info: string;
  detail: string;
};

export type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][] }
  | { type: "code"; title?: string; code: string }
  | {
      type: "callout";
      tone: "tip" | "warn" | "note";
      title?: string;
      text: string;
    }
  | { type: "terms"; items: { zh: string; en: string; text: string }[] }
  | { type: "sequence"; caption?: string; steps: SequenceStep[] }
  | { type: "walk"; caption?: string; steps: WalkStep[] }
  | { type: "sdp"; caption?: string; lines: SdpLine[] }
  | { type: "packets"; caption?: string; rows: PacketRow[] };

export type SectionId =
  | "concept"
  | "messages"
  | "example"
  | "capture"
  | "commands"
  | "code"
  | "vendors"
  | "pitfalls";

export type Section = {
  id: SectionId;
  blocks: Block[];
};

export type QuizItem = {
  prompt: string;
  choices: string[];
  answer: number;
  explain: string;
};

export type Lesson = {
  id: string;
  phase: string;
  title: string;
  objective: string;
  minutes: number;
  coreTopics: string[];
  practice: string[];
  acceptance: string[];
  sections: Section[];
  quiz: QuizItem[];
};

export const sectionTitle: Record<SectionId, string> = {
  concept: "核心概念",
  messages: "协议报文",
  example: "真实示例",
  capture: "抓包分析",
  commands: "工具命令",
  code: "代码实践",
  vendors: "IPC 厂商差异",
  pitfalls: "常见坑",
};
