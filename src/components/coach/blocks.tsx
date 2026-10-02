"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Block, PacketRow, SdpLine, WalkStep } from "@/content/model";

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);

  return (
    <Button
      type="button"
      size="xs"
      variant="outline"
      className="border-white/20 bg-transparent text-[#d6e5d8] hover:bg-white/10 hover:text-white"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(
          () => {
            setDone(true);
            window.setTimeout(() => setDone(false), 1200);
          },
          () => setDone(false),
        );
      }}
    >
      {done ? <Check /> : <Copy />}
      {done ? "已复制" : "复制"}
    </Button>
  );
}

function PacketFrame({
  title,
  extra,
  children,
}: {
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="overflow-hidden rounded-xl bg-[#14201c] text-[#d6e5d8] shadow-sm">
      {(title || extra) && (
        <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2 text-xs text-[#8aa394]">
          <span>{title}</span>
          {extra}
        </figcaption>
      )}
      {children}
    </figure>
  );
}

function CodeBlock({ title, code }: { title?: string; code: string }) {
  return (
    <PacketFrame title={title || "代码"} extra={<CopyButton text={code} />}>
      <pre className="overflow-x-auto px-3 py-3 font-mono text-[13px] leading-6 whitespace-pre-wrap break-all">
        {code}
      </pre>
    </PacketFrame>
  );
}

function WalkBlock({ caption, steps }: { caption?: string; steps: WalkStep[] }) {
  const [index, setIndex] = useState(0);
  const [showRecv, setShowRecv] = useState(false);
  const step = steps[index];
  if (!step) return null;

  function go(next: number) {
    setIndex(next);
    setShowRecv(false);
  }

  return (
    <PacketFrame title={caption || "握手"} extra={<CopyButton text={showRecv ? step.recv : step.send} />}>
      <div className="flex flex-wrap gap-1 border-b border-white/10 px-2 py-2">
        {steps.map((item, itemIndex) => (
          <button
            key={item.name}
            type="button"
            onClick={() => go(itemIndex)}
            className={cn(
              "rounded-md px-2 py-1 font-mono text-xs",
              itemIndex === index ? "bg-[#e7c27a] text-[#14201c]" : "text-[#8aa394] hover:bg-white/5",
            )}
          >
            {itemIndex + 1}. {item.name}
          </button>
        ))}
      </div>
      <div className="space-y-3 px-3 py-3">
        <p className="text-sm text-[#e7c27a]">{step.why}</p>
        <div>
          <p className="mb-1 font-mono text-[11px] tracking-wide text-[#8aa394]">发送</p>
          <pre className="overflow-x-auto font-mono text-[13px] leading-6 whitespace-pre-wrap break-all">{step.send}</pre>
        </div>
        {showRecv ? (
          <div>
            <p className="mb-1 font-mono text-[11px] tracking-wide text-[#8aa394]">接收</p>
            <pre className="overflow-x-auto font-mono text-[13px] leading-6 whitespace-pre-wrap break-all">{step.recv}</pre>
          </div>
        ) : (
          <Button type="button" size="sm" variant="secondary" onClick={() => setShowRecv(true)}>
            看摄像机怎么答
          </Button>
        )}
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" className="border-white/20 bg-transparent text-[#d6e5d8]" disabled={index === 0} onClick={() => go(index - 1)}>
            上一步
          </Button>
          <Button type="button" size="sm" variant="outline" className="border-white/20 bg-transparent text-[#d6e5d8]" disabled={index >= steps.length - 1} onClick={() => go(index + 1)}>
            下一步
          </Button>
        </div>
      </div>
    </PacketFrame>
  );
}

function SdpBlock({ caption, lines }: { caption?: string; lines: SdpLine[] }) {
  const [active, setActive] = useState(0);
  const line = lines[active];

  return (
    <PacketFrame title={caption || "SDP"}>
      <div className="px-1 py-2">
        {lines.map((item, index) => (
          <button
            key={`${item.text}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              "block w-full rounded px-2 py-1 text-left font-mono text-[13px] leading-6",
              index === active ? "bg-white/10 text-[#e7c27a]" : "hover:bg-white/5",
            )}
          >
            {item.text}
          </button>
        ))}
      </div>
      {line && <p className="border-t border-white/10 px-3 py-3 text-sm leading-6 text-[#e7c27a]">{line.note}</p>}
    </PacketFrame>
  );
}

function PacketsBlock({ caption, rows }: { caption?: string; rows: PacketRow[] }) {
  const [active, setActive] = useState<number | null>(null);
  const selected = active === null ? null : rows[active];

  return (
    <PacketFrame title={caption || "抓包"} extra={selected ? <CopyButton text={`${selected.no} ${selected.info}\n${selected.detail}`} /> : undefined}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left font-mono text-[12px]">
          <thead className="text-[#8aa394]">
            <tr className="border-b border-white/10">
              {["No.", "Time", "Source", "Destination", "Proto", "Info"].map((header) => (
                <th key={header} className="px-2 py-2 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.no}-${index}`}
                tabIndex={0}
                onClick={() => setActive(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActive(index);
                  }
                }}
                className={cn(
                  "cursor-pointer border-b border-white/5 align-top",
                  active === index ? "bg-white/10 text-[#e7c27a]" : "hover:bg-white/5",
                )}
              >
                <td className="px-2 py-2">{row.no}</td>
                <td className="px-2 py-2">{row.time}</td>
                <td className="px-2 py-2">{row.src}</td>
                <td className="px-2 py-2">{row.dst}</td>
                <td className="px-2 py-2">{row.proto}</td>
                <td className="px-2 py-2">{row.info}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <p className="border-t border-white/10 px-3 py-3 text-sm leading-6 text-[#e7c27a]">{selected.detail}</p>}
    </PacketFrame>
  );
}

function Callout({ tone, title, text }: { tone: "tip" | "warn" | "note"; title?: string; text: string }) {
  const toneClass = {
    tip: "border-[#9a3412]/30 bg-[#9a3412]/10",
    warn: "border-[#b45309]/40 bg-[#fff4e5]",
    note: "border-[#d6d3d1] bg-white/60",
  }[tone];
  const label = { tip: "提示", warn: "注意", note: "说明" }[tone];

  return (
    <aside className={cn("rounded-xl border px-4 py-3 text-sm leading-6", toneClass)}>
      <p className="mb-1 font-medium">{title || label}</p>
      <p>{text}</p>
    </aside>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "p":
            return (
              <p key={key} className="text-[15px] leading-7">
                {block.text}
              </p>
            );
          case "ul":
            return (
              <ul key={key} className="list-disc space-y-2 pl-5 text-[15px] leading-7">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="list-decimal space-y-2 pl-5 text-[15px] leading-7">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            );
          case "table":
            return (
              <div key={key} className="overflow-x-auto rounded-xl border border-[#e0d5c4] bg-white/70">
                {block.caption && <p className="border-b border-[#e0d5c4] px-3 py-2 text-sm font-medium">{block.caption}</p>}
                <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                  <thead className="bg-[#f6f0e6] text-[#57534e]">
                    <tr>
                      {block.headers.map((header) => (
                        <th key={header} className="px-3 py-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-[#e0d5c4] align-top">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 leading-6">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "code":
            return <CodeBlock key={key} title={block.title} code={block.code} />;
          case "callout":
            return <Callout key={key} tone={block.tone} title={block.title} text={block.text} />;
          case "terms":
            return (
              <dl key={key} className="space-y-3">
                {block.items.map((item) => (
                  <div key={item.en} className="rounded-xl border border-[#e0d5c4] bg-white/70 px-3 py-3">
                    <dt className="text-sm font-medium">
                      {item.zh}
                      <span className="ml-2 font-mono text-xs text-[#78716c]">{item.en}</span>
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-[#44403c]">{item.text}</dd>
                  </div>
                ))}
              </dl>
            );
          case "sequence":
            return (
              <div key={key} className="rounded-xl border border-[#e0d5c4] bg-white/70 px-3 py-3">
                {block.caption && <p className="mb-3 text-sm font-medium">{block.caption}</p>}
                <ol className="space-y-3">
                  {block.steps.map((step, stepIndex) => (
                    <li key={`${step.title}-${stepIndex}`} className="grid grid-cols-[auto_1fr] gap-3">
                      <span className="font-mono text-xs text-[#9a3412]">{stepIndex + 1}</span>
                      <div>
                        <p className="font-mono text-xs text-[#78716c]">
                          {step.from} → {step.to}
                        </p>
                        <p className="font-medium">{step.title}</p>
                        {step.detail && <p className="text-sm leading-6 text-[#44403c]">{step.detail}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            );
          case "walk":
            return <WalkBlock key={key} caption={block.caption} steps={block.steps} />;
          case "sdp":
            return <SdpBlock key={key} caption={block.caption} lines={block.lines} />;
          case "packets":
            return <PacketsBlock key={key} caption={block.caption} rows={block.rows} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
