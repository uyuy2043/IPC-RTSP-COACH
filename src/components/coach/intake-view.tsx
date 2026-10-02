"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  Brand,
  CaptureLevel,
  DailyMinutes,
  Familiarity,
  Goal,
  IpcAccess,
  LanguageChoice,
  NetworkLevel,
  OsChoice,
  Profile,
  ToolChoice,
} from "@/content/model";

type Draft = {
  os: OsChoice | null;
  languages: LanguageChoice[];
  languageNote: string;
  network: NetworkLevel | null;
  capture: CaptureLevel | null;
  rtp: Familiarity | null;
  sdp: Familiarity | null;
  onvif: Familiarity | null;
  hasIpc: IpcAccess | null;
  brand: Brand | null;
  model: string;
  rtspUrl: string;
  knowsUrl: boolean;
  tools: ToolChoice[];
  goal: Goal | null;
  daily: DailyMinutes | null;
};

const initial: Draft = {
  os: null,
  languages: [],
  languageNote: "",
  network: null,
  capture: null,
  rtp: null,
  sdp: null,
  onvif: null,
  hasIpc: null,
  brand: null,
  model: "",
  rtspUrl: "",
  knowsUrl: false,
  tools: [],
  goal: null,
  daily: null,
};

function toggle<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function Choice({
  selected,
  title,
  detail,
  onClick,
}: {
  selected: boolean;
  title: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-3 text-left transition",
        selected ? "border-[#9a3412] bg-[#9a3412]/10" : "border-[#e0d5c4] bg-white/75 hover:border-[#9a3412]/40",
      )}
    >
      <span className="block text-sm font-medium">{title}</span>
      {detail && <span className="mt-1 block text-sm leading-6 text-[#57534e]">{detail}</span>}
    </button>
  );
}

export function IntakeView({ onDone }: { onDone: (profile: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState("");

  function patch(partial: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...partial }));
    setError("");
  }

  function valid(): string {
    if (step === 0) {
      if (!draft.os) return "先选一个平时使用的系统。";
      if (draft.languages.length === 0) return "至少选一种你想用来写练习的语言。";
    }
    if (step === 1) {
      if (!draft.network || !draft.capture) return "网络和抓包两项都要选。";
    }
    if (step === 2) {
      if (!draft.rtp || !draft.sdp || !draft.onvif) return "RTP、SDP、ONVIF 都选一个熟悉程度。";
    }
    if (step === 3) {
      if (!draft.hasIpc || !draft.brand) return "先说有没有设备，再选品牌。";
      if (draft.knowsUrl && !draft.rtspUrl.trim()) return "勾了真实地址，就把 RTSP URL 填上。";
    }
    if (step === 5 && !draft.goal) return "选一个这次最想学会的方向。";
    if (step === 6 && !draft.daily) return "选一个每天能坐下来的时长。";
    return "";
  }

  function next() {
    const message = valid();
    if (message) {
      setError(message);
      return;
    }
    if (step < 6) {
      setStep(step + 1);
      return;
    }
    onDone({
      os: draft.os || "linux",
      languages: draft.languages,
      languageNote: draft.languageNote.trim(),
      network: draft.network || "some",
      capture: draft.capture || "watched",
      rtp: draft.rtp || "none",
      sdp: draft.sdp || "none",
      onvif: draft.onvif || "none",
      hasIpc: draft.hasIpc || "no",
      brand: draft.brand || "unknown",
      model: draft.model.trim(),
      rtspUrl: draft.rtspUrl.trim(),
      knowsUrl: draft.knowsUrl && Boolean(draft.rtspUrl.trim()),
      tools: draft.tools,
      goal: draft.goal || "all",
      daily: draft.daily || 45,
    });
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="font-mono text-xs tracking-widest text-[#9a3412]">第 {step + 1} 题 / 共 7 题</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#e7dfd0]">
        <div className="h-full bg-[#9a3412]" style={{ width: `${((step + 1) / 7) * 100}%` }} />
      </div>
      <div className="mt-6 space-y-4">
        {step === 0 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">你用什么系统和语言？</h2>
            <p className="text-sm leading-6 text-[#57534e]">系统决定后面命令怎么写。语言用来提醒你把 Python 练习迁回去。</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["windows", "Windows"],
                  ["macos", "macOS"],
                  ["linux", "Linux"],
                  ["mixed", "多系统"],
                ] as const
              ).map(([value, label]) => (
                <Choice key={value} selected={draft.os === value} title={label} onClick={() => patch({ os: value })} />
              ))}
            </div>
            <p className="text-sm font-medium">想用来写练习的语言，可多选</p>
            <div className="grid gap-2">
              {(
                [
                  ["python", "Python"],
                  ["cpp", "C/C++"],
                  ["go", "Go"],
                  ["java", "Java"],
                  ["other", "其他语言"],
                ] as const
              ).map(([value, label]) => (
                <Choice
                  key={value}
                  selected={draft.languages.includes(value)}
                  title={label}
                  onClick={() => patch({ languages: toggle(draft.languages, value) })}
                />
              ))}
            </div>
            {draft.languages.includes("other") && (
              <div className="space-y-2">
                <Label htmlFor="language-note">其他语言的名字</Label>
                <Input id="language-note" value={draft.languageNote} onChange={(event) => patch({ languageNote: event.target.value })} />
              </div>
            )}
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">TCP、UDP、HTTP 和抓包，你现在在哪？</h2>
            <p className="text-sm font-medium">网络</p>
            <div className="grid gap-2">
              {(
                [
                  ["new", "网络刚入门", "端口、TCP 和 UDP 还需要先补一节"],
                  ["some", "知道大致差别", "能说出 TCP、UDP 和 HTTP 不是一回事"],
                  ["ok", "能自己抓 HTTP", "看过请求行、头部和空行"],
                  ["strong", "经常分析应用协议", "习惯用抓包核对文本协议"],
                ] as const
              ).map(([value, title, detail]) => (
                <Choice key={value} selected={draft.network === value} title={title} detail={detail} onClick={() => patch({ network: value })} />
              ))}
            </div>
            <p className="text-sm font-medium">抓包</p>
            <div className="grid gap-2">
              {(
                [
                  ["never", "没抓过包"],
                  ["watched", "看别人抓过"],
                  ["often", "经常自己抓"],
                ] as const
              ).map(([value, title]) => (
                <Choice key={value} selected={draft.capture === value} title={title} onClick={() => patch({ capture: value })} />
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">RTP、SDP、ONVIF 分别熟到哪？</h2>
            {(
              [
                ["rtp", "RTP", draft.rtp],
                ["sdp", "SDP", draft.sdp],
                ["onvif", "ONVIF", draft.onvif],
              ] as const
            ).map(([key, title, current]) => (
              <div key={key} className="space-y-2">
                <p className="text-sm font-medium">{title}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["none", "没听过"],
                      ["name", "听过名字"],
                      ["used", "用过"],
                      ["work", "工作里经常处理"],
                    ] as const
                  ).map(([value, label]) => (
                    <Choice key={value} selected={current === value} title={label} onClick={() => patch({ [key]: value })} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">手头的摄像机是什么？</h2>
            <p className="text-sm leading-6 text-[#57534e]">没有设备也能学。地址只填你有权访问的设备，或者留空用教学示例。</p>
            <div className="grid gap-2">
              {(
                [
                  ["yes", "我有一台"],
                  ["borrow", "可以借用一台"],
                  ["no", "现在没有"],
                ] as const
              ).map(([value, title]) => (
                <Choice key={value} selected={draft.hasIpc === value} title={title} onClick={() => patch({ hasIpc: value })} />
              ))}
            </div>
            <p className="text-sm font-medium">品牌</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["hikvision", "海康威视"],
                  ["dahua", "大华"],
                  ["uniview", "宇视"],
                  ["other", "其他品牌"],
                  ["unknown", "品牌未定"],
                  ["none", "暂无设备"],
                ] as const
              ).map(([value, title]) => (
                <Choice key={value} selected={draft.brand === value} title={title} onClick={() => patch({ brand: value })} />
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">型号，可以空着</Label>
              <Input id="model" value={draft.model} placeholder="例如 DS-2CD3T46" onChange={(event) => patch({ model: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rtsp-url">RTSP 地址</Label>
              <Textarea
                id="rtsp-url"
                value={draft.rtspUrl}
                placeholder="rtsp://user:pass@192.168.1.64:554/..."
                onChange={(event) => patch({ rtspUrl: event.target.value })}
              />
            </div>
            <label className="flex items-start gap-2 text-sm leading-6">
              <input
                type="checkbox"
                className="mt-1"
                checked={draft.knowsUrl}
                onChange={(event) => patch({ knowsUrl: event.target.checked })}
              />
              这是我有权抓包、有权拉流的真实地址。不勾的话，课程继续用教学示例。
            </label>
          </>
        )}
        {step === 4 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">这些工具你已经装了哪些？</h2>
            <p className="text-sm leading-6 text-[#57534e]">没装也可以。路线里会按你的系统写出补装命令。</p>
            <div className="grid gap-2">
              {(
                [
                  ["wireshark", "Wireshark", "抓 RTSP 和 RTP"],
                  ["ffmpeg", "FFmpeg", "含 ffprobe，用来对照握手"],
                  ["vlc", "VLC", "先看画面"],
                  ["gstreamer", "GStreamer", "把解包和解码拆开"],
                ] as const
              ).map(([value, title, detail]) => (
                <Choice
                  key={value}
                  selected={draft.tools.includes(value)}
                  title={title}
                  detail={detail}
                  onClick={() => patch({ tools: toggle(draft.tools, value) })}
                />
              ))}
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">这次最想学会什么？</h2>
            <div className="grid gap-2">
              {(
                [
                  ["capture", "抓包分析"],
                  ["debug", "排障"],
                  ["client", "写拉流客户端"],
                  ["platform", "平台接入"],
                  ["develop", "二次开发"],
                  ["all", "抓包、排障、客户端和接入都要"],
                ] as const
              ).map(([value, title]) => (
                <Choice key={value} selected={draft.goal === value} title={title} onClick={() => patch({ goal: value })} />
              ))}
            </div>
          </>
        )}
        {step === 6 && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">每天能连续学多久？</h2>
            <p className="text-sm leading-6 text-[#57534e]">用来把每课的分钟数估成几次。一次只打开一课，测验通过才能继续。</p>
            <div className="grid gap-2">
              {(
                [
                  [20, "大约 20 分钟"],
                  [45, "大约 45 分钟"],
                  [90, "一个半小时"],
                  [180, "半天"],
                ] as const
              ).map(([value, title]) => (
                <Choice key={value} selected={draft.daily === value} title={title} onClick={() => patch({ daily: value })} />
              ))}
            </div>
          </>
        )}
        {error && <p className="text-sm text-[#9a3412]">{error}</p>}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
            上一题
          </Button>
          <Button type="button" onClick={next}>
            {step === 6 ? "生成我的路线" : "下一题"}
          </Button>
        </div>
      </div>
    </div>
  );
}
