import { useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import { cn } from "~/lib/cn";
import { WrapText } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";

/**
 * Editor shell: header, line-number gutter and a monospace textarea.
 * A native textarea keeps typing, selection and mobile keyboards fast and
 * accessible; the gutter scrolls in sync and marks the error line.
 */
export function CodePane({
  id,
  label,
  value,
  onChange,
  readOnly = false,
  placeholder,
  errorLine,
  markTone = "danger",
  actions,
  headerExtra,
  body,
  textareaRef,
  onKeyDown,
  onPaste,
  onDropText,
  describedBy,
  stale = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  errorLine?: number;
  /** Colour of the marked gutter line. */
  markTone?: "danger" | "warning";
  actions?: ReactNode;
  /** Rendered after the label, e.g. a view switch. */
  headerExtra?: ReactNode;
  /** Replaces the editor body (e.g. a tree view). */
  body?: ReactNode;
  textareaRef?: Ref<HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  onPaste?: React.ClipboardEventHandler<HTMLTextAreaElement>;
  onDropText?: (file: File) => void;
  describedBy?: string;
  /** Dim the content (e.g. output from before the latest error). */
  stale?: boolean;
}) {
  const gutterRef = useRef<HTMLPreElement>(null);
  const [wrap, setWrap] = useState(false);
  const [dragging, setDragging] = useState(false);

  const lineCount = useMemo(() => {
    let count = 1;
    for (let i = 0; i < value.length; i++)
      if (value.charCodeAt(i) === 10) count++;
    return count;
  }, [value]);

  const gutter = useMemo(() => {
    const numbers = Array.from({ length: lineCount }, (_, i) => i + 1);
    if (!errorLine || errorLine > lineCount) return numbers.join("\n");
    return (
      <>
        {numbers.slice(0, errorLine - 1).join("\n")}
        {errorLine > 1 && "\n"}
        <span
          className={cn(
            "-mx-2 px-2 font-semibold",
            markTone === "warning"
              ? "bg-warning-soft text-warning"
              : "bg-danger-soft text-danger",
          )}
        >
          {errorLine}
        </span>
        {errorLine < lineCount && "\n"}
        {numbers.slice(errorLine).join("\n")}
      </>
    );
  }, [lineCount, errorLine, markTone]);

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col bg-surface",
        dragging && "outline-2 -outline-offset-2 outline-accent",
      )}
      onDragOver={
        onDropText
          ? (event) => {
              event.preventDefault();
              setDragging(true);
            }
          : undefined
      }
      onDragLeave={onDropText ? () => setDragging(false) : undefined}
      onDrop={
        onDropText
          ? (event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files[0];
              if (file) onDropText(file);
            }
          : undefined
      }
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border pr-1.5 pl-3 pointer-coarse:h-12 sm:pl-4">
        <label htmlFor={id} className="label-mono text-fg">
          {label}
        </label>
        {headerExtra}
        <div className="ml-auto flex items-center gap-0.5">
          {!body && (
            <IconButton
              icon={WrapText}
              label={wrap ? "Turn off line wrap" : "Wrap long lines"}
              aria-pressed={wrap}
              size="sm"
              onClick={() => setWrap((w) => !w)}
              className="aria-pressed:bg-surface-2 aria-pressed:text-fg"
            />
          )}
          {actions}
        </div>
      </div>

      {body ? (
        <div
          data-pane-body
          className="flex h-[var(--pane-h,min(60vh,28rem))] flex-col md:h-auto md:min-h-0 md:flex-1"
        >
          {body}
        </div>
      ) : (
        <div
          data-pane-body
          className="relative flex h-[var(--pane-h,min(45vh,22rem))] md:h-auto md:min-h-0 md:flex-1"
        >
          {!wrap && (
            <pre
              ref={gutterRef}
              aria-hidden
              className="w-12 shrink-0 overflow-hidden border-r border-border bg-bg py-3 pr-2 text-right font-mono text-[0.8125rem] leading-[1.375rem] text-fg-subtle select-none"
            >
              {gutter}
            </pre>
          )}
          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            readOnly={readOnly}
            onChange={
              onChange ? (event) => onChange(event.target.value) : undefined
            }
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onScroll={(event) => {
              if (gutterRef.current)
                gutterRef.current.scrollTop = event.currentTarget.scrollTop;
            }}
            placeholder={placeholder}
            aria-describedby={describedBy}
            aria-invalid={errorLine && markTone === "danger" ? true : undefined}
            wrap={wrap ? "soft" : "off"}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className={cn(
              "min-w-0 flex-1 resize-none bg-transparent px-3 py-3 font-mono text-[0.8125rem] leading-[1.375rem] text-fg outline-none placeholder:text-fg-subtle",
              "focus-visible:bg-bg/40",
              !wrap && "whitespace-pre",
              readOnly && "cursor-text",
              stale && "opacity-40",
            )}
          />
        </div>
      )}
    </div>
  );
}
