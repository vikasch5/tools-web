import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { scoreTyping, typingPassages } from "~/tools/engine/everyday";
import { cn } from "~/lib/cn";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { StatGrid } from "./results";

type State = "ready" | "running" | "done";

export function TypingTest() {
  const [duration, setDuration] = useState(60);
  const [passage, setPassage] = useState(0);
  const [typed, setTyped] = useState("");
  const [state, setState] = useState<State>("ready");
  const [started, setStarted] = useState(0);
  const [now, setNow] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Long tests repeat the passage so it never runs out.
  const target = useMemo(() => {
    const text = typingPassages[passage];
    return Array.from(
      { length: Math.ceil(duration / 60) * 2 },
      () => text,
    ).join(" ");
  }, [passage, duration]);

  const elapsed =
    state === "ready" ? 0 : Math.min(duration, (now - started) / 1000);
  const left = Math.max(0, Math.ceil(duration - elapsed));
  const score = scoreTyping(target, typed, Math.max(elapsed, 1));
  // Speed over the first seconds swings wildly; show it once it means something.
  const settled = state === "done" || elapsed >= 3;

  useEffect(() => {
    if (state !== "running") return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if ((t - started) / 1000 >= duration) setState("done");
    }, 200);
    return () => clearInterval(timer);
  }, [state, started, duration]);

  const reset = (next = passage) => {
    setPassage(next);
    setTyped("");
    setState("ready");
    setStarted(0);
    setNow(0);
    inputRef.current?.focus();
  };

  // Show the passage around the cursor, with each typed character marked.
  const view = target.slice(0, Math.max(typed.length + 220, 400));

  return (
    <Panel
      toolbar={
        <>
          <Segmented
            label="Time"
            value={String(duration)}
            onChange={(v) => {
              setDuration(Number(v));
              reset();
            }}
            choices={[
              { value: "60", label: "1 min" },
              { value: "180", label: "3 min" },
              { value: "300", label: "5 min" },
            ]}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={() => reset((passage + 1) % typingPassages.length)}
          >
            New passage
          </Button>
        </>
      }
      status={
        state === "done" ? (
          <StatusMessage tone="success">
            Done: {score.wpm} words per minute at {score.accuracy}% accuracy.
          </StatusMessage>
        ) : state === "running" ? (
          <StatusMessage tone="working">{left} seconds left.</StatusMessage>
        ) : (
          <StatusMessage tone="idle">
            The timer starts with your first key. Type the text exactly,
            including capitals and punctuation.
          </StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.8fr)_minmax(15rem,1fr)]">
        <PanelSection title="Type this">
          <div className="space-y-3 p-4">
            <p
              aria-hidden
              className="max-h-48 overflow-hidden font-mono text-[0.9375rem] leading-relaxed text-fg-subtle select-none"
            >
              {Array.from(view).map((ch, i) => (
                <span
                  key={i}
                  className={cn(
                    i < typed.length &&
                      (typed[i] === ch
                        ? "text-fg"
                        : "rounded-sm bg-danger-soft text-danger"),
                    i === typed.length && "border-b-2 border-accent text-fg",
                  )}
                >
                  {ch}
                </span>
              ))}
            </p>
            <p className="sr-only">{typingPassages[passage]}</p>
            <label htmlFor="typing-input" className="sr-only">
              Type the passage here
            </label>
            <textarea
              id="typing-input"
              ref={inputRef}
              value={typed}
              disabled={state === "done"}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              rows={4}
              placeholder="Start typing here…"
              onPaste={(e) => e.preventDefault()}
              onChange={(e) => {
                if (state === "ready") {
                  const t = Date.now();
                  setStarted(t);
                  setNow(t);
                  setState("running");
                }
                setTyped(e.target.value.slice(0, target.length));
              }}
              className="w-full resize-none rounded-md border border-border bg-bg p-3 font-mono text-[0.9375rem] text-fg outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60"
            />
            {state === "done" && (
              <Button
                variant="primary"
                icon={RotateCcw}
                onClick={() => reset()}
              >
                Try again
              </Button>
            )}
          </div>
        </PanelSection>
        <PanelSection title="Score">
          <div aria-live="polite">
            <StatGrid
              stats={[
                { label: "Speed (WPM)", value: settled ? score.wpm : "–" },
                { label: "Accuracy", value: `${score.accuracy}%` },
                { label: "Raw speed", value: settled ? score.rawWpm : "–" },
                { label: "Mistakes", value: score.errors },
                { label: "Time left", value: `${left}s` },
                { label: "Characters", value: score.typed },
              ]}
            />
            <p className="border-t border-border px-4 py-3 text-xs text-fg-muted">
              A word is 5 characters. Speed counts only correct characters; raw
              speed counts everything typed. Pasting is turned off.
            </p>
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
