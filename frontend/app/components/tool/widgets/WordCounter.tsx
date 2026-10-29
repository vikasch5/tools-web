import { useDeferredValue, useMemo, useState } from "react";
import { Check, Copy, Eraser, Sparkles } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { formatDuration, textStats } from "~/tools/engine/text-stats";
import {
  platformLimits,
  smsParts,
  visibleLength,
} from "~/tools/engine/everyday";
import { cn } from "~/lib/cn";
import type { WidgetProps } from "./index";
import { Panel, PanelSection, StatusMessage, useCopy } from "../Panel";

const SAMPLE = `Good writing is clear writing. Before you publish, read your draft out loud and cut every word that does not earn its place.

Short sentences help readers scan. Long sentences still have a place, but they work best when the idea needs room to breathe. Writing for the web means writing for people who skim.`;

export function WordCounter({ preset }: WidgetProps) {
  const limitsFirst = preset?.mode === "characters";
  const [text, setText] = useState("");
  const deferred = useDeferredValue(text);
  const stats = useMemo(() => textStats(deferred), [deferred]);
  const { copied, copy } = useCopy();
  const visible = useMemo(() => visibleLength(deferred), [deferred]);
  const sms = useMemo(() => smsParts(deferred), [deferred]);

  const cards = [
    ...(limitsFirst
      ? [
          { label: "Characters", value: visible.toLocaleString("en") },
          { label: "Words", value: stats.words.toLocaleString("en") },
        ]
      : [
          { label: "Words", value: stats.words.toLocaleString("en") },
          { label: "Characters", value: stats.characters.toLocaleString("en") },
        ]),
    {
      label: "Without spaces",
      value: stats.charactersNoSpaces.toLocaleString("en"),
    },
    { label: "Sentences", value: stats.sentences.toLocaleString("en") },
    { label: "Paragraphs", value: stats.paragraphs.toLocaleString("en") },
    { label: "Lines", value: stats.lines.toLocaleString("en") },
    { label: "Reading time", value: formatDuration(stats.readingMinutes) },
    { label: "Speaking time", value: formatDuration(stats.speakingMinutes) },
  ];

  return (
    <Panel
      status={
        text ? (
          <StatusMessage tone="success">
            {stats.words.toLocaleString("en")}{" "}
            {stats.words === 1 ? "word" : "words"},{" "}
            {(limitsFirst ? visible : stats.characters).toLocaleString("en")}{" "}
            {(limitsFirst ? visible : stats.characters) === 1 ? "character" : "characters"}
          </StatusMessage>
        ) : (
          <StatusMessage tone="idle">Counts update as you type.</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
        <PanelSection
          title="Your text"
          actions={
            <>
              <IconButton
                icon={Sparkles}
                label="Load sample"
                size="sm"
                onClick={() => setText(SAMPLE)}
              />
              <IconButton
                icon={copied ? Check : Copy}
                label={copied ? "Copied" : "Copy text"}
                size="sm"
                disabled={!text}
                onClick={() => copy(text)}
              />
              <IconButton
                icon={Eraser}
                label="Clear"
                size="sm"
                disabled={!text}
                onClick={() => setText("")}
              />
            </>
          }
        >
          <label htmlFor="word-counter-input" className="sr-only">
            Text to count
          </label>
          <textarea
            id="word-counter-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type or paste your text…"
            className="h-[min(55vh,28rem)] w-full resize-y bg-transparent p-4 text-[0.9375rem] leading-relaxed text-fg outline-none placeholder:text-fg-subtle focus-visible:bg-bg/40 lg:h-[32rem]"
          />
        </PanelSection>

        <PanelSection title="Counts">
          <dl className="grid grid-cols-2 gap-px bg-border">
            {cards.map((card) => (
              <div key={card.label} className="bg-surface px-4 py-3">
                <dt className="text-xs text-fg-subtle">{card.label}</dt>
                <dd className="mt-0.5 font-display text-2xl font-semibold tracking-tight text-fg tabular-nums">
                  {card.value}
                </dd>
              </div>
            ))}
          </dl>
          {limitsFirst && (
            <>
              <div className="border-t border-border px-4 py-3">
                <h3 className="label-mono font-sans text-fg-subtle">
                  Character limits
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {platformLimits.map((p) => {
                    const left = p.limit - visible;
                    return (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate text-fg">
                          {p.label}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-xs tabular-nums",
                            left < 0
                              ? "font-semibold text-danger"
                              : "text-fg-muted",
                          )}
                        >
                          {left < 0 ? `${-left} over` : `${left} left`} /{" "}
                          {p.limit.toLocaleString("en")}
                        </span>
                      </li>
                    );
                  })}
                  <li className="flex items-center gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-fg">
                      SMS{sms.unicode ? " (Unicode)" : ""}
                    </span>
                    <span className="font-mono text-xs text-fg-muted tabular-nums">
                      {sms.parts} {sms.parts === 1 ? "part" : "parts"} ·{" "}
                      {sms.perPart} per part
                    </span>
                  </li>
                </ul>
                <p className="mt-2 text-xs text-fg-subtle">
                  Counted as you see them ({visible.toLocaleString("en")}): an
                  emoji or a Hindi letter with its matra counts once. Platforms
                  may count some characters differently.
                </p>
              </div>
            </>
          )}
          <div className="border-t border-border px-4 py-3">
            <h3 className="label-mono font-sans text-fg-subtle">
              Most used words
            </h3>
            {stats.keywords.length > 0 ? (
              <ol className="mt-2 space-y-1.5">
                {stats.keywords.map((k) => (
                  <li key={k.word} className="flex items-center gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-fg">
                      {k.word}
                    </span>
                    <span className="font-mono text-xs text-fg-muted tabular-nums">
                      {k.count}× ·{" "}
                      {Math.round((k.count / stats.words) * 1000) / 10}%
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-fg-muted">
                Words used more than once appear here (common words like “the”
                are skipped).
              </p>
            )}
          </div>
          {!limitsFirst && (
            <>
              <div className="border-t border-border px-4 py-3">
                <h3 className="label-mono font-sans text-fg-subtle">
                  Character limits
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {platformLimits.map((p) => {
                    const left = p.limit - visible;
                    return (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate text-fg">
                          {p.label}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-xs tabular-nums",
                            left < 0
                              ? "font-semibold text-danger"
                              : "text-fg-muted",
                          )}
                        >
                          {left < 0 ? `${-left} over` : `${left} left`} /{" "}
                          {p.limit.toLocaleString("en")}
                        </span>
                      </li>
                    );
                  })}
                  <li className="flex items-center gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-fg">
                      SMS{sms.unicode ? " (Unicode)" : ""}
                    </span>
                    <span className="font-mono text-xs text-fg-muted tabular-nums">
                      {sms.parts} {sms.parts === 1 ? "part" : "parts"} ·{" "}
                      {sms.perPart} per part
                    </span>
                  </li>
                </ul>
                <p className="mt-2 text-xs text-fg-subtle">
                  Counted as you see them ({visible.toLocaleString("en")}): an
                  emoji or a Hindi letter with its matra counts once. Platforms
                  may count some characters differently.
                </p>
              </div>
            </>
          )}
        </PanelSection>
      </div>
    </Panel>
  );
}
