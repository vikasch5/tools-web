import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeftRight,
  Check,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  Eraser,
  FileUp,
  LoaderCircle,
  SlidersHorizontal,
  TriangleAlert,
  Sparkles,
} from "lucide-react";
import type { TextToolDefinition, ToolOptionValues } from "~/tools/types";
import type { EngineAction, EngineError } from "~/tools/engine/types";
import { runInWorker, warmUpWorker } from "~/tools/engine/client";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { cn } from "~/lib/cn";
import { CodePane } from "./CodePane";
import { PaneResizer, clampPaneHeight } from "./PaneResizer";
import { OptionControls } from "./OptionControls";
import { byteLength, formatBytes, lineRange } from "./format";

/** Subset of the definition the workspace needs (keeps props serialisable). */
export type WorkspaceTool = Pick<
  TextToolDefinition,
  | "slug"
  | "engine"
  | "actions"
  | "options"
  | "engineOptions"
  | "language"
  | "accept"
  | "downloadExtension"
  | "sample"
  | "tree"
>;

type Status =
  | { kind: "idle" }
  | { kind: "working"; action: EngineAction }
  | {
      kind: "success";
      action: EngineAction;
      message: string;
      inBytes: number;
      outBytes: number | null;
      warnings?: EngineError[];
      fixes?: EngineError[];
      ms: number;
    }
  | { kind: "error"; error: EngineError };

// Loaded only when someone opens the tree view.
const JsonTree = lazy(() =>
  import("./json-tree/JsonTree").then((m) => ({ default: m.JsonTree })),
);

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const defaultOptions = (tool: WorkspaceTool): ToolOptionValues =>
  Object.fromEntries(tool.options.map((o) => [o.id, o.default]));

export function ToolWorkspace({ tool }: { tool: WorkspaceTool }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState<ToolOptionValues>(() =>
    defaultOptions(tool),
  );
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const supportsTree = tool.tree === true;
  const [view, setView] = useState<"text" | "tree">("text");
  // User-chosen editor height (px); null = fit to the screen automatically.
  const [paneHeight, setPaneHeight] = useState<number | null>(null);
  const panesRef = useRef<HTMLDivElement>(null);
  const panesId = `${tool.slug}-panes`;
  // Options are always visible from md up; collapsible on phones.
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsId = `${tool.slug}-options`;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pasted = useRef(false);
  const storageKey = `tool-options:${tool.slug}`;
  const statusId = `${tool.slug}-status`;
  const primary = tool.actions[0];

  // Restore saved options and editor height after hydration (never the input text).
  useEffect(() => {
    try {
      const savedHeight = Number(localStorage.getItem("tool-pane-height"));
      if (savedHeight) setPaneHeight(clampPaneHeight(savedHeight));
    } catch {
      // Ignore unreadable storage.
    }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved && typeof saved === "object")
        setOptions((o) => ({ ...o, ...saved }));
    } catch {
      // Ignore unreadable storage.
    }
    const idle =
      window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
    idle(() => warmUpWorker());
  }, [storageKey]);

  const run = useCallback(
    async (
      action: EngineAction,
      opts: ToolOptionValues = options,
      text: string = input,
    ) => {
      setStatus({ kind: "working", action });
      const started = performance.now();
      const result = await runInWorker({
        engine: tool.engine,
        action,
        input: text,
        options: { ...tool.engineOptions, ...opts },
      });
      const ms = Math.round(performance.now() - started);
      if (result.ok) {
        if (result.output !== null) setOutput(result.output);
        setStatus({
          kind: "success",
          action,
          message: result.message,
          inBytes: byteLength(text),
          outBytes: result.output === null ? null : byteLength(result.output),
          ms,
          warnings: result.warnings,
          fixes: result.fixes,
        });
      } else {
        setStatus({ kind: "error", error: result.error });
      }
    },
    [input, options, tool],
  );

  const changeOption = (id: string, value: string | boolean) => {
    const next = { ...options, [id]: value };
    setOptions(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Storage unavailable: option applies for this visit only.
    }
    // Re-run so the output reflects the new option immediately.
    if (status.kind === "success" && status.outBytes !== null)
      run(status.action, next);
  };

  /** Replaces the input; pasted, opened and sample text runs the main action. */
  const loadText = (text: string, autoRun = false) => {
    setInput(text);
    setStatus({ kind: "idle" });
    if (autoRun && text.trim()) run(primary.id, options, text);
  };

  const openFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setStatus({
        kind: "error",
        error: {
          message: `“${file.name}” is ${formatBytes(file.size)}. The limit is 5 MB.`,
        },
      });
      return;
    }
    loadText(await file.text(), true);
  };

  const goToError = (error: EngineError) => {
    const textarea = inputRef.current;
    if (!textarea || !error.line) return;
    const { start, end } = lineRange(input, error.line);
    const caret = Math.min(start + Math.max((error.column ?? 1) - 1, 0), end);
    textarea.focus();
    textarea.setSelectionRange(caret, end > caret ? end : caret);
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 22;
    textarea.scrollTop = Math.max(
      0,
      (error.line - 1) * lineHeight - textarea.clientHeight / 3,
    );
  };

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus({
        kind: "error",
        error: {
          message: "Copy failed. Select the output and copy it manually.",
        },
      });
    }
  };

  const downloadOutput = () => {
    const url = URL.createObjectURL(
      new Blob([output], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `output.${tool.downloadExtension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Tree source: the latest output, or the input after a Validate.
  const treeSource = output || (status.kind === "success" ? input : "");
  const treeData = useMemo(() => {
    if (!supportsTree || view !== "tree" || !treeSource) return undefined;
    try {
      return JSON.parse(treeSource);
    } catch {
      return undefined;
    }
  }, [supportsTree, view, treeSource]);

  // The first problem to point at: an error, or the first warning.
  const issue =
    status.kind === "error"
      ? status.error
      : status.kind === "success"
        ? status.warnings?.[0]
        : undefined;
  const errorLine = issue?.line;
  const working = status.kind === "working";
  const inputLines = input ? input.split("\n").length : 0;
  const inputStats = `${inputLines.toLocaleString()} ${inputLines === 1 ? "line" : "lines"} · ${formatBytes(byteLength(input))}`;

  return (
    <section
      aria-label="Tool workspace"
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-md"
      style={
        paneHeight
          ? ({ "--pane-h": `${paneHeight}px` } as React.CSSProperties)
          : undefined
      }
    >
      {/* One toolbar: actions, options (inline from md), file actions */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-surface-2/50 px-2.5 py-2 sm:px-3">
        <div className="flex items-center gap-2">
          {tool.actions.map((action, index) => (
            <Button
              key={action.id}
              variant={index === 0 ? "primary" : "secondary"}
              size="sm"
              onClick={() => run(action.id)}
              disabled={working}
              title={index === 0 ? `${action.label} (Ctrl+Enter)` : undefined}
              aria-keyshortcuts={
                index === 0 ? "Control+Enter Meta+Enter" : undefined
              }
            >
              {working && status.action === action.id && (
                <LoaderCircle aria-hidden size={15} className="animate-spin" />
              )}
              {action.label}
            </Button>
          ))}
        </div>

        {tool.options.length > 0 && (
          <div
            id={optionsId}
            className={cn(
              "order-last w-full border-t border-border pt-2 md:order-none md:flex md:w-auto md:border-t-0 md:border-l md:pt-0 md:pl-3",
              !optionsOpen && "hidden",
            )}
          >
            <OptionControls
              options={tool.options}
              values={options}
              onChange={changeOption}
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-0.5">
          {tool.options.length > 0 && (
            <IconButton
              icon={SlidersHorizontal}
              label={optionsOpen ? "Hide options" : "Show options"}
              aria-expanded={optionsOpen}
              aria-controls={optionsId}
              size="sm"
              onClick={() => setOptionsOpen((open) => !open)}
              className="aria-expanded:bg-surface-2 aria-expanded:text-fg md:hidden"
            />
          )}
          <input
            ref={fileRef}
            type="file"
            accept={tool.accept.join(",")}
            className="hidden"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) openFile(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Input and output side by side from md; stacked on phones */}
      <div
        ref={panesRef}
        id={panesId}
        className="grid gap-px bg-border md:h-[var(--pane-h,clamp(20rem,calc(100dvh-22rem),54rem))] md:grid-cols-2"
      >
        <CodePane
          id={`${tool.slug}-input`}
          label={`Input · ${tool.language}`}
          value={input}
          onChange={(value) => {
            if (pasted.current) {
              pasted.current = false;
              loadText(value, true);
              return;
            }
            setInput(value);
            if (status.kind === "error") setStatus({ kind: "idle" });
          }}
          onPaste={() => {
            // The next change event carries the full text after the paste.
            pasted.current = true;
            // A paste that changes nothing fires no change event; clear the flag.
            setTimeout(() => (pasted.current = false), 0);
          }}
          placeholder={`Paste ${tool.language} to ${primary.label.toLowerCase()} it instantly…`}
          errorLine={errorLine}
          markTone={status.kind === "error" ? "danger" : "warning"}
          textareaRef={inputRef}
          describedBy={statusId}
          onDropText={openFile}
          actions={
            <>
              <IconButton
                icon={Sparkles}
                label="Load sample"
                size="sm"
                onClick={() => loadText(tool.sample, true)}
              />
              <IconButton
                icon={FileUp}
                label="Open file"
                size="sm"
                onClick={() => fileRef.current?.click()}
              />
              <IconButton
                icon={Eraser}
                label="Clear"
                size="sm"
                onClick={() => {
                  setInput("");
                  setOutput("");
                  setStatus({ kind: "idle" });
                  inputRef.current?.focus();
                }}
              />
            </>
          }
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              run(primary.id);
            }
          }}
        />
        <CodePane
          id={`${tool.slug}-output`}
          label="Output"
          value={output}
          readOnly
          stale={status.kind === "error"}
          headerExtra={
            supportsTree && (
              <div
                role="group"
                aria-label="Output view"
                className="ml-2 inline-flex rounded-md bg-surface-2 p-0.5"
              >
                {(["text", "tree"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className="h-6 rounded-sm px-2.5 text-xs font-medium text-fg-muted capitalize transition-colors hover:text-fg aria-pressed:bg-surface aria-pressed:text-fg aria-pressed:shadow-sm pointer-coarse:h-9"
                  >
                    {v}
                  </button>
                ))}
              </div>
            )
          }
          body={
            supportsTree && view === "tree" ? (
              treeData !== undefined ? (
                <Suspense
                  fallback={
                    <p className="p-4 text-sm text-fg-subtle">Loading tree…</p>
                  }
                >
                  <JsonTree data={treeData} />
                </Suspense>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                  <p className="font-medium text-fg">Nothing to show yet</p>
                  <p className="max-w-xs text-sm text-fg-muted">
                    {status.kind === "error"
                      ? `Fix the error in your input, then press ${primary.label} to explore it as a tree.`
                      : `Paste ${tool.language} and press ${primary.label} to explore the result as a tree.`}
                  </p>
                </div>
              )
            ) : undefined
          }
          placeholder="Result appears here."
          actions={
            <>
              <IconButton
                icon={ArrowLeftRight}
                label="Use output as input"
                size="sm"
                disabled={!output}
                onClick={() => loadText(output)}
              />
              <IconButton
                icon={copied ? Check : Copy}
                label={copied ? "Copied" : "Copy output"}
                size="sm"
                disabled={!output}
                onClick={copyOutput}
              />
              <IconButton
                icon={Download}
                label="Download output"
                size="sm"
                disabled={!output}
                onClick={downloadOutput}
              />
            </>
          }
        />
      </div>

      <PaneResizer
        value={paneHeight}
        controls={panesId}
        measure={() => {
          const grid = panesRef.current;
          if (!grid) return 400;
          // Side by side: the grid height; stacked: one pane body.
          const body = grid.querySelector<HTMLElement>("[data-pane-body]");
          return getComputedStyle(grid).gridTemplateColumns.split(" ").length >
            1
            ? grid.clientHeight
            : (body?.clientHeight ?? 320);
        }}
        onChange={(height) => {
          setPaneHeight(height);
          try {
            if (height)
              localStorage.setItem("tool-pane-height", String(height));
            else localStorage.removeItem("tool-pane-height");
          } catch {
            // Storage unavailable: size applies for this visit only.
          }
        }}
      />

      {/* Status */}
      <div className="flex min-h-10 shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-3 py-1.5 text-sm sm:px-4">
        <div
          id={statusId}
          role="status"
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1"
        >
          <StatusText status={status} />
          {copied && (
            <span className="sr-only">Output copied to clipboard</span>
          )}
        </div>
        {issue?.line && (
          <Button size="sm" variant="ghost" onClick={() => goToError(issue)}>
            {status.kind === "error" ? "Go to error" : "Go to line"}
          </Button>
        )}
        <span className="hidden font-mono text-[0.6875rem] text-fg-subtle tabular-nums sm:inline">
          {inputStats}
        </span>
      </div>
    </section>
  );
}

function StatusText({ status }: { status: Status }) {
  switch (status.kind) {
    case "idle":
      return <span className="text-fg-subtle">Ready.</span>;
    case "working":
      return (
        <span className="inline-flex items-center gap-1.5 text-fg-muted">
          <LoaderCircle aria-hidden size={15} className="animate-spin" />
          Working…
        </span>
      );
    case "success": {
      const saved =
        status.outBytes !== null && status.outBytes < status.inBytes
          ? Math.round((1 - status.outBytes / status.inBytes) * 100)
          : null;
      const warnings = status.warnings ?? [];
      const fixes = status.fixes ?? [];
      return (
        <>
          {warnings.length > 0 ? (
            <span className="inline-flex min-w-0 items-start gap-1.5 text-warning">
              <TriangleAlert
                aria-hidden
                size={15}
                strokeWidth={2}
                className="mt-0.5 shrink-0"
              />
              <span className="min-w-0 break-words">
                <strong className="font-semibold">
                  {status.message} with {warnings.length}{" "}
                  {warnings.length === 1 ? "warning" : "warnings"}.{" "}
                </strong>
                <IssueText issue={warnings[0]} />
              </span>
            </span>
          ) : (
            <span className="inline-flex min-w-0 items-start gap-1.5 text-success">
              <CircleCheck
                aria-hidden
                size={15}
                strokeWidth={2}
                className="mt-0.5 shrink-0"
              />
              <span className="min-w-0 break-words">
                <strong className="font-medium">{status.message}</strong>
                {fixes.length > 0 && (
                  <span className="text-fg-muted">
                    {" "}
                    · fixed {fixes.length} broken{" "}
                    {fixes.length === 1 ? "tag" : "tags"}.{" "}
                    <IssueText issue={fixes[0]} />
                    {fixes.length > 1 && ` (+${fixes.length - 1} more)`}
                  </span>
                )}
              </span>
            </span>
          )}
          {status.outBytes !== null && (
            <span className="font-mono text-xs whitespace-nowrap text-fg-subtle tabular-nums">
              {formatBytes(status.inBytes)} → {formatBytes(status.outBytes)}
              {saved !== null && saved > 0 && ` (−${saved}%)`} · {status.ms} ms
            </span>
          )}
        </>
      );
    }
    case "error":
      return (
        <span className="inline-flex min-w-0 items-start gap-1.5 text-danger">
          <CircleAlert
            aria-hidden
            size={15}
            strokeWidth={2}
            className="mt-0.5 shrink-0"
          />
          <span className="min-w-0 break-words">
            <IssueText issue={status.error} />
          </span>
        </span>
      );
  }
}

function IssueText({ issue }: { issue: EngineError }) {
  return (
    <>
      {issue.line && (
        <span className="font-semibold">
          Line {issue.line}
          {issue.column ? `, column ${issue.column}` : ""}:{" "}
        </span>
      )}
      {issue.message}
    </>
  );
}
