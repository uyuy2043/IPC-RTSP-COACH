"use client";

import { useEffect, useState } from "react";
import { lessonsFor, totalSessions } from "@/content/curriculum";
import type { Profile } from "@/content/model";
import { sessionsFor } from "@/content/profile-text";
import { IntakeView } from "./intake-view";
import { LessonView } from "./lesson-view";
import { RoadmapView } from "./roadmap-view";

const STORAGE_KEY = "rtsp-coach-v1";

type Screen = "intake" | "roadmap" | "lesson" | "done";

type Persisted = {
  profile: Profile;
  completedIds: string[];
  passedIds: string[];
  screen: Screen;
  lessonId: string | null;
};

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Profile>;
  return typeof item.os === "string" && Array.isArray(item.languages) && typeof item.network === "string" && typeof item.daily === "number";
}

export function CoachApp() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [screen, setScreen] = useState<Screen>("intake");
  const [lessonId, setLessonId] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as Partial<Persisted>;
        if (isProfile(data.profile)) {
          setProfile(data.profile);
          setCompletedIds(Array.isArray(data.completedIds) ? data.completedIds.filter((item) => typeof item === "string") : []);
          setPassedIds(Array.isArray(data.passedIds) ? data.passedIds.filter((item) => typeof item === "string") : []);
          setLessonId(typeof data.lessonId === "string" ? data.lessonId : null);
          if (data.screen === "roadmap" || data.screen === "lesson" || data.screen === "done") setScreen(data.screen);
          else setScreen("roadmap");
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!profile || screen === "intake") {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload: Persisted = { profile, completedIds, passedIds, screen, lessonId };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [ready, profile, completedIds, passedIds, screen, lessonId]);

  function reset() {
    setProfile(null);
    setCompletedIds([]);
    setPassedIds([]);
    setLessonId(null);
    setScreen("intake");
  }

  const lessons = profile ? lessonsFor(profile) : [];
  const active = lessons.find((lesson) => lesson.id === lessonId) ?? null;
  let view: Screen = screen;
  if (!profile) view = "intake";
  else if (view === "intake") view = "roadmap";
  else if (view === "lesson" && !active) view = "roadmap";

  const activeSessions = profile && active ? sessionsFor(active.minutes, profile.daily) : 0;

  function openLesson(id: string) {
    const index = lessons.findIndex((lesson) => lesson.id === id);
    const frontier = lessons.findIndex((lesson) => !completedIds.includes(lesson.id));
    const maxOpen = frontier === -1 ? lessons.length - 1 : frontier;
    if (index < 0 || index > maxOpen) return;
    setLessonId(id);
    setScreen("lesson");
  }

  function continueLesson(id: string) {
    if (!passedIds.includes(id)) return;
    const index = lessons.findIndex((lesson) => lesson.id === id);
    if (!completedIds.includes(id)) setCompletedIds((current) => [...current, id]);
    const next = lessons[index + 1];
    if (!next) {
      setLessonId(null);
      setScreen("done");
      return;
    }
    setLessonId(next.id);
    setScreen("lesson");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#e0d5c4]">
        <div className="mx-auto flex max-w-3xl items-end justify-between gap-4 px-4 py-5">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-[#9a3412]">RTSP COACH</p>
            <p className="text-xl font-semibold tracking-tight">RTSP 教练台</p>
          </div>
          {profile && view !== "intake" && (
            <p className="text-right font-mono text-xs leading-5 text-[#57534e]">
              每天 {profile.daily} 分钟
              <br />
              全程约 {totalSessions(profile)} 次
            </p>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        {!ready && <p className="text-sm text-[#57534e]">正在打开上次的进度。</p>}
        {ready && view === "intake" && <IntakeView onDone={(next) => { setProfile(next); setCompletedIds([]); setPassedIds([]); setLessonId(null); setScreen("roadmap"); }} />}
        {ready && view === "roadmap" && profile && (
          <RoadmapView profile={profile} completedIds={completedIds} onOpen={openLesson} onReset={reset} />
        )}
        {ready && view === "lesson" && profile && active && (
          <LessonView
            lesson={active}
            profile={profile}
            sessions={activeSessions}
            quizPassed={passedIds.includes(active.id)}
            onPass={() => setPassedIds((current) => (current.includes(active.id) ? current : [...current, active.id]))}
            onContinue={() => continueLesson(active.id)}
            onBack={() => setScreen("roadmap")}
          />
        )}
        {ready && view === "done" && profile && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">这一路走完了</h2>
            <p className="text-sm leading-7">
              {lessons.length} 个模块都已记下。进度留在这台浏览器里。要换设备或换目标，可以重新评估。
            </p>
            <div className="flex gap-2">
              <button type="button" className="text-sm text-[#9a3412] underline-offset-4 hover:underline" onClick={() => setScreen("roadmap")}>
                回到路线
              </button>
              <button type="button" className="text-sm text-[#57534e] underline-offset-4 hover:underline" onClick={reset}>
                重新评估
              </button>
            </div>
          </div>
        )}
      </main>
      <footer className="mx-auto max-w-3xl px-4 pb-10 text-xs leading-5 text-[#78716c]">
        只连接你拥有或被明确授权的摄像机。教学示例地址不能当成可以随便扫描的目标。
      </footer>
    </div>
  );
}
