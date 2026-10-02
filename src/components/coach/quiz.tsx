"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizItem } from "@/content/model";

export function Quiz({
  items,
  passed,
  onPass,
}: {
  items: QuizItem[];
  passed: boolean;
  onPass: () => void;
}) {
  const [picked, setPicked] = useState<(number | null)[]>(() => items.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const ready = picked.every((choice) => choice !== null);
  const correct = submitted && items.every((item, index) => picked[index] === item.answer);

  function submit() {
    if (!ready) return;
    setSubmitted(true);
    if (items.every((item, index) => picked[index] === item.answer)) onPass();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[#e0d5c4] bg-white/80 p-4">
      <div>
        <h2 className="text-lg font-semibold">本节三题</h2>
        <p className="mt-1 text-sm leading-6 text-[#57534e]">
          三题都答对并提交后，「我学完了，继续」才会打开下一模块。
        </p>
        {passed && <p className="mt-2 text-sm font-medium text-[#9a3412]">这节测验已经通过。</p>}
      </div>
      {items.map((item, index) => {
        const choice = picked[index];
        const show = submitted || passed;
        return (
          <fieldset key={item.prompt} className="space-y-2">
            <legend className="text-sm font-medium leading-6">
              {index + 1}. {item.prompt}
            </legend>
            <div className="grid gap-2">
              {item.choices.map((label, choiceIndex) => {
                const selected = choice === choiceIndex;
                const isAnswer = choiceIndex === item.answer;
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setPicked((current) => current.map((value, valueIndex) => (valueIndex === index ? choiceIndex : value)));
                      setSubmitted(false);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm leading-6",
                      selected ? "border-[#9a3412] bg-[#9a3412]/10" : "border-[#e0d5c4] bg-[#fffdf8]",
                      show && isAnswer && "border-[#3f6212] bg-[#f4f7ea]",
                      show && selected && !isAnswer && "border-[#b91c1c] bg-[#fef2f2]",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {show && <p className="text-sm leading-6 text-[#44403c]">{item.explain}</p>}
          </fieldset>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!ready} onClick={submit}>
          提交答案
        </Button>
        {submitted && !correct && <p className="text-sm text-[#7c2d12]">还有没选对的。看完解析再改，然后重新提交。</p>}
        {correct && <p className="text-sm text-[#3f6212]">三题都对了，可以继续。</p>}
      </div>
    </section>
  );
}
