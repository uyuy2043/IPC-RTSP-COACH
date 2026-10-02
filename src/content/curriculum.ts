import type { Lesson, Profile } from "./model";
import { primer, place, methods, state } from "./lessons/early";
import { sdp, rtp, transport, auth } from "./lessons/mid";
import { keepalive, vendors, wireshark, tools } from "./lessons/later";
import { pythonClient, trouble, security } from "./lessons/last";
import { fill, isEmphasis, sessionsFor } from "./profile-text";

const catalog: Lesson[] = [
  primer,
  place,
  methods,
  state,
  sdp,
  rtp,
  transport,
  auth,
  keepalive,
  vendors,
  wireshark,
  tools,
  pythonClient,
  trouble,
  security,
];

export function needsPrimer(profile: Profile): boolean {
  return profile.network === "new" || profile.capture === "never";
}

export function lessonsFor(profile: Profile): Lesson[] {
  return catalog.filter((lesson) => lesson.id !== "primer" || needsPrimer(profile));
}

function applyBlock(block: Lesson["sections"][number]["blocks"][number], apply: (text: string) => string) {
  switch (block.type) {
    case "p":
      return { ...block, text: apply(block.text) };
    case "callout":
      return { ...block, text: apply(block.text), title: block.title ? apply(block.title) : undefined };
    case "ul":
    case "ol":
      return { ...block, items: block.items.map(apply) };
    case "table":
      return {
        ...block,
        caption: block.caption && apply(block.caption),
        headers: block.headers.map(apply),
        rows: block.rows.map((row) => row.map(apply)),
      };
    case "code":
      return { ...block, title: block.title && apply(block.title), code: apply(block.code) };
    case "terms":
      return {
        ...block,
        items: block.items.map((item) => ({ ...item, zh: apply(item.zh), en: apply(item.en), text: apply(item.text) })),
      };
    case "sequence":
      return {
        ...block,
        caption: block.caption && apply(block.caption),
        steps: block.steps.map((step) => ({
          ...step,
          from: apply(step.from),
          to: apply(step.to),
          title: apply(step.title),
          detail: step.detail && apply(step.detail),
        })),
      };
    case "walk":
      return {
        ...block,
        caption: block.caption && apply(block.caption),
        steps: block.steps.map((step) => ({
          ...step,
          name: apply(step.name),
          send: apply(step.send),
          recv: apply(step.recv),
          why: apply(step.why),
        })),
      };
    case "sdp":
      return {
        ...block,
        caption: block.caption && apply(block.caption),
        lines: block.lines.map((line) => ({ text: apply(line.text), note: apply(line.note) })),
      };
    case "packets":
      return {
        ...block,
        caption: block.caption && apply(block.caption),
        rows: block.rows.map((row) => ({
          no: apply(row.no),
          time: apply(row.time),
          src: apply(row.src),
          dst: apply(row.dst),
          proto: apply(row.proto),
          info: apply(row.info),
          detail: apply(row.detail),
        })),
      };
    default:
      return block;
  }
}

export function personalizeLesson(lesson: Lesson, profile: Profile): Lesson {
  const apply = (text: string) => fill(text, profile);
  return {
    ...lesson,
    objective: apply(lesson.objective),
    coreTopics: lesson.coreTopics.map(apply),
    practice: lesson.practice.map(apply),
    acceptance: lesson.acceptance.map(apply),
    sections: lesson.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block) => applyBlock(block, apply)),
    })),
    quiz: lesson.quiz.map((item) => ({
      ...item,
      prompt: apply(item.prompt),
      choices: item.choices.map(apply),
      explain: apply(item.explain),
    })),
  };
}

export function lessonPlan(lesson: Lesson, profile: Profile) {
  return {
    lesson,
    emphasis: isEmphasis(profile.goal, lesson.id),
    sessions: sessionsFor(lesson.minutes, profile.daily),
  };
}

export function totalSessions(profile: Profile): number {
  return lessonsFor(profile).reduce((sum, lesson) => sum + sessionsFor(lesson.minutes, profile.daily), 0);
}
