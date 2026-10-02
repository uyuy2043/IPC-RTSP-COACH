"use client";

import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { lessonsFor, lessonPlan, needsPrimer, personalizeLesson, totalSessions } from "@/content/curriculum";
import type { Familiarity, Profile } from "@/content/model";
import { installHints, toolSummary } from "@/content/profile-text";

const familiarLabel: Record<Familiarity, string> = {
  none: "没听过",
  name: "听过名字",
  used: "用过",
  work: "工作里经常处理",
};

export function RoadmapView({
  profile,
  completedIds,
  onOpen,
  onReset,
}: {
  profile: Profile;
  completedIds: string[];
  onOpen: (lessonId: string) => void;
  onReset: () => void;
}) {
  const lessons = lessonsFor(profile).map((lesson) => personalizeLesson(lesson, profile));
  const openIndex = lessons.findIndex((lesson) => !completedIds.includes(lesson.id));
  const frontier = openIndex === -1 ? lessons.length - 1 : openIndex;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">你的路线</h2>
        <p className="text-sm leading-7 text-[#44403c]">
          {needsPrimer(profile)
            ? "网络或抓包还没上手，所以从阶段 0 的网络底子开始。"
            : "网络和抓包你已经有底子，阶段 0 不排进路线，从 RTSP 在 IPC 里的位置开始。"}
          按每天 {profile.daily} 分钟，全程大约 {totalSessions(profile)} 次。一次只打开当前模块，测验通过后才能进入下一个。
        </p>
        <p className="text-sm leading-6 text-[#57534e]">
          RTP {familiarLabel[profile.rtp]}，SDP {familiarLabel[profile.sdp]}，ONVIF {familiarLabel[profile.onvif]}。工具：{toolSummary(profile)}。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-[#44403c]">
          {installHints(profile).map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </div>
      <ol className="space-y-4">
        {lessons.map((lesson, index) => {
          const plan = lessonPlan(lesson, profile);
          const done = completedIds.includes(lesson.id);
          const locked = index > frontier;
          const current = index === frontier && !done;
          return (
            <li key={lesson.id} className={locked ? "rounded-2xl border border-[#e0d5c4] bg-white/50 p-4 opacity-80" : "rounded-2xl border border-[#e0d5c4] bg-white/80 p-4"}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-[#9a3412]">{lesson.phase}</span>
                {done && <Badge variant="secondary">已完成</Badge>}
                {current && <Badge>当前</Badge>}
                {locked && (
                  <Badge variant="outline">
                    <Lock />
                    未解锁
                  </Badge>
                )}
                {plan.emphasis && <Badge variant="outline">和你的目标更相关</Badge>}
              </div>
              <h3 className="mt-2 text-lg font-semibold">{lesson.title}</h3>
              <p className="mt-2 text-sm leading-6">{lesson.objective}</p>
              <p className="mt-2 font-mono text-xs text-[#78716c]">
                约 {plan.sessions} 次 · 本课 {lesson.minutes} 分钟 · 每天 {profile.daily} 分钟
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-[#9a3412]">核心</p>
                  <ul className="mt-1 list-disc pl-4 text-sm leading-6">
                    {lesson.coreTopics.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#9a3412]">练习</p>
                  <ul className="mt-1 list-disc pl-4 text-sm leading-6">
                    {lesson.practice.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#9a3412]">验收</p>
                  <ul className="mt-1 list-disc pl-4 text-sm leading-6">
                    {lesson.acceptance.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                {locked ? (
                  <Button type="button" disabled>
                    先完成上一模块
                  </Button>
                ) : (
                  <Button type="button" variant={current ? "default" : "outline"} onClick={() => onOpen(lesson.id)}>
                    {done ? "复习这一课" : "开始这一课"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <Button type="button" variant="ghost" onClick={onReset}>
        重新评估
      </Button>
    </div>
  );
}
