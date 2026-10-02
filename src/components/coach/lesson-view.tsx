"use client";

import { Button } from "@/components/ui/button";
import { personalizeLesson } from "@/content/curriculum";
import { sectionTitle, type Lesson, type Profile } from "@/content/model";
import { Blocks } from "./blocks";
import { Quiz } from "./quiz";

export function LessonView({
  lesson,
  profile,
  sessions,
  quizPassed,
  onPass,
  onContinue,
  onBack,
}: {
  lesson: Lesson;
  profile: Profile;
  sessions: number;
  quizPassed: boolean;
  onPass: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const personal = personalizeLesson(lesson, profile);

  return (
    <article className="space-y-8">
      <div className="space-y-3">
        <button type="button" onClick={onBack} className="text-sm text-[#9a3412] underline-offset-4 hover:underline">
          返回路线
        </button>
        <p className="font-mono text-xs tracking-widest text-[#9a3412]">{personal.phase}</p>
        <h2 className="text-2xl font-semibold tracking-tight">{personal.title}</h2>
        <p className="text-[15px] leading-7">{personal.objective}</p>
        <p className="font-mono text-xs text-[#78716c]">
          本课 {personal.minutes} 分钟 · 按每天 {profile.daily} 分钟大约 {sessions} 次
        </p>
      </div>
      <nav className="sticky top-0 z-10 -mx-4 overflow-x-auto border-b border-[#e0d5c4] bg-[#f3eee4]/95 px-4 py-2 backdrop-blur">
        <div className="flex w-max gap-2">
          {personal.sections.map((section) => (
            <a key={section.id} href={`#section-${section.id}`} className="rounded-full bg-white/80 px-3 py-1 text-xs text-[#44403c]">
              {sectionTitle[section.id]}
            </a>
          ))}
          <a href="#section-quiz" className="rounded-full bg-white/80 px-3 py-1 text-xs text-[#44403c]">
            测验
          </a>
        </div>
      </nav>
      {personal.sections.map((section) => (
        <section key={section.id} id={`section-${section.id}`} className="scroll-mt-16 space-y-4">
          <h3 className="text-xl font-semibold">{sectionTitle[section.id]}</h3>
          <Blocks blocks={section.blocks} />
        </section>
      ))}
      <div id="section-quiz" className="scroll-mt-16">
        <Quiz key={personal.id} items={personal.quiz} passed={quizPassed} onPass={onPass} />
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-[#e0d5c4] pt-4">
        <Button type="button" disabled={!quizPassed} onClick={onContinue}>
          我学完了，继续
        </Button>
        {!quizPassed && <p className="text-sm text-[#57534e]">先提交本节的三道题。</p>}
      </div>
    </article>
  );
}
