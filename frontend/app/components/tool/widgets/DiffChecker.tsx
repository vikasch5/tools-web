import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Check, Copy, Eraser, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { cn } from "~/lib/cn";
import type { DiffLine, DiffResult } from "~/tools/engine/diff";
import { diffToText } from "~/tools/engine/diff";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { Segmented, Switch } from "../OptionControls";
import { Panel, PanelSection, StatusMessage, useCopy } from "../Panel";

const SAMPLE_A = `Shipping policy
Orders ship within 2 business days.
Free shipping on orders over $50.
Returns accepted within 14 days.
Contact support@example.com with questions.`;
const SAMPLE_B = `Shipping policy
Orders ship within 1 business day.
Free shipping on orders over $50.
Returns accepted within 30 days.
Exchanges are always free.
Contact support@example.com with questions.`;

type Row = { left?: DiffLine; right?: DiffLine };

/** Pairs removed and added lines so changes sit side by side. */
function toRows(lines: DiffLine[]): Row[] {
  const rows: Row[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type === "equal") {
      rows.push({ left: lines[i], right: lines[i] });
      i++;
      continue;
    }
    const removed: DiffLine[] = [];
    const added: DiffLine[] = [];
    while (i < lines.length && lines[i].type !== "equal") {
      (lines[i].type === "remove" ? removed : added).push(lines[i]);
      i++;
    }
    for (let k = 0; k < Math.max(removed.length, added.length); k++)
      rows.push({ left: removed[k], right: added[k] });
  }
  return rows;
}

const marker = { add: "+", remove: "−", equal: " " } as const;
const tone = {
  add: "bg-success-soft text-fg",
  remove: "bg-danger-soft text-fg",
  equal: "text-fg-muted",
} as const;
const lineLabel = { add: "Added", remove: "Removed", equal: "Unchanged" } as const;

function Cell({ line, side }: { line?: DiffLine; side: "a" | "b" }) {
  if (!line) return <td colSpan={3} className="bg-surface-2/60" aria-label="No line" />;
  const number = side === "a" ? ("a" in line ? line.a : "") : "b" in line ? line.b : "";
  return (
    <>
      <td className="w-12 border-r border-border px-2 text-right text-fg-subtle select-none">{number}</td>
      <td className={cn("w-6 text-center font-semibold select-none", tone[line.type])}>
        <span aria-hidden>{marker[line.type]}</span>
        <span className="sr-only">{lineLabel[line.type]}</span>
      </td>
      <td className={cn("px-2 whitespace-pre-wrap break-all", tone[line.type])}>{line.text || " "}</td>
    </>
  );
}

export function DiffChecker() {
  const [original, setOriginal] = useState("");
  const [changed, setChanged] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [view, setView] = useState<"split" | "unified">("split");
  const [result, setResult] = useState<DiffResult | null>(null);
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState("");
  const { copied, copy } = useCopy();

  useEffect(() => warmUpWorker(), []);

  const compare = async (
    a = original,
    b = changed,
    opts = { ignoreWhitespace, ignoreCase },
  ) => {
    if (!a && !b) {
      setState("error");
      setError("Paste the original and changed text first.");
      return;
    }
    setState("working");
    const r = await runTaskInWorker({ type: "diff", original: a, changed: b, options: opts });
    if (r.ok) {
      setResult(r.value);
      setState("idle");
    } else {
      setState("error");
      setError(r.message);
    }
  };

  const setOption = (next: { ignoreWhitespace: boolean; ignoreCase: boolean }) => {
    setIgnoreWhitespace(next.ignoreWhitespace);
    setIgnoreCase(next.ignoreCase);
    if (result) compare(original, changed, next);
  };

  const rows = useMemo(() => (result ? toRows(result.lines) : []), [result]);
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      compare();
    }
  };

  const editor = (id: string, title: string, value: string, set: (v: string) => void) => (
    <PanelSection title={title}>
      <label htmlFor={id} className="sr-only">
        {title}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => {
          set(event.target.value);
          if (state === "error") setState("idle");
        }}
        onKeyDown={onKeyDown}
        wrap="off"
        spellCheck={false}
        placeholder={`Paste the ${title.toLowerCase()} text…`}
        className="h-[min(40vh,18rem)] w-full resize-y bg-transparent p-3 font-mono text-[0.8125rem] leading-[1.375rem] whitespace-pre text-fg outline-none placeholder:text-fg-subtle focus-visible:bg-bg/40"
      />
    </PanelSection>
  );

  return (
    <Panel
      toolbar={
        <>
          <Button
            variant="primary"
            size="sm"
            onClick={() => compare()}
            disabled={state === "working"}
            title="Compare (Ctrl+Enter)"
            aria-keyshortcuts="Control+Enter Meta+Enter"
          >
            {state === "working" && <LoaderCircle aria-hidden size={15} className="animate-spin" />}
            Compare
          </Button>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Switch
              label="Ignore whitespace"
              checked={ignoreWhitespace}
              onChange={(v) => setOption({ ignoreWhitespace: v, ignoreCase })}
            />
            <Switch
              label="Ignore case"
              checked={ignoreCase}
              onChange={(v) => setOption({ ignoreWhitespace, ignoreCase: v })}
            />
            <Segmented
              label="View"
              value={view}
              onChange={(v) => setView(v as "split" | "unified")}
              choices={[
                { value: "split", label: "Side by side" },
                { value: "unified", label: "Unified" },
              ]}
            />
          </div>
          <div className="ml-auto flex items-center gap-0.5">
            <IconButton
              icon={Sparkles}
              label="Load sample"
              size="sm"
              onClick={() => {
                setOriginal(SAMPLE_A);
                setChanged(SAMPLE_B);
                compare(SAMPLE_A, SAMPLE_B);
              }}
            />
            <IconButton
              icon={ArrowLeftRight}
              label="Swap sides"
              size="sm"
              onClick={() => {
                setOriginal(changed);
                setChanged(original);
                if (result) compare(changed, original);
              }}
            />
            <IconButton
              icon={Eraser}
              label="Clear"
              size="sm"
              onClick={() => {
                setOriginal("");
                setChanged("");
                setResult(null);
                setState("idle");
              }}
            />
          </div>
        </>
      }
      status={
        state === "working" ? (
          <StatusMessage tone="working">Comparing…</StatusMessage>
        ) : state === "error" ? (
          <StatusMessage tone="error">{error}</StatusMessage>
        ) : result ? (
          result.identical ? (
            <StatusMessage tone="success">
              No differences{ignoreWhitespace || ignoreCase ? " (with the chosen ignore options)" : ""}.
            </StatusMessage>
          ) : (
            <StatusMessage tone="success">
              {result.removed} {result.removed === 1 ? "line" : "lines"} removed, {result.added}{" "}
              {result.added === 1 ? "line" : "lines"} added.
            </StatusMessage>
          )
        ) : (
          <StatusMessage tone="idle">Paste two versions and press Compare.</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border md:grid-cols-2">
        {editor("diff-original", "Original", original, setOriginal)}
        {editor("diff-changed", "Changed", changed, setChanged)}
      </div>

      {result && !result.identical && (
        <PanelSection
          title="Differences"
          className="border-t border-border"
          actions={
            <IconButton
              icon={copied ? Check : Copy}
              label={copied ? "Copied" : "Copy as unified diff"}
              size="sm"
              onClick={() => copy(diffToText(result))}
            />
          }
        >
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full border-collapse font-mono text-[0.8125rem] leading-[1.375rem]">
              <caption className="sr-only">
                Line-by-line differences. Removed lines are marked minus, added lines plus.
              </caption>
              <tbody>
                {view === "split"
                  ? rows.map((row, i) => (
                      <tr key={i} className="border-b border-border/60 align-top">
                        <Cell line={row.left} side="a" />
                        <Cell line={row.right} side="b" />
                      </tr>
                    ))
                  : result.lines.map((line, i) => (
                      <tr key={i} className="border-b border-border/60 align-top">
                        <td className="w-12 border-r border-border px-2 text-right text-fg-subtle select-none">
                          {"a" in line ? line.a : ""}
                        </td>
                        <Cell line={line} side="b" />
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </PanelSection>
      )}
    </Panel>
  );
}
