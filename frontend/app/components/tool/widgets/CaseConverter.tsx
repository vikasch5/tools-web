import { useDeferredValue, useMemo, useState } from "react";
import { Check, Copy, Eraser, Sparkles } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { cases, convertCase } from "~/tools/engine/case";
import { Panel, PanelSection, StatusMessage, useCopy } from "../Panel";

const SAMPLE = `the quick brown fox jumps over the lazy dog. it was a sunny day!
userAccountId
HTTP request timeout`;

export function CaseConverter() {
  const [text, setText] = useState("");
  const deferred = useDeferredValue(text);
  const results = useMemo(() => cases.map((c) => ({ ...c, value: deferred ? convertCase(deferred, c.id) : "" })), [deferred]);
  const { copied, copy } = useCopy();

  return (
    <Panel
      status={
        copied ? (
          <StatusMessage tone="success">Copied {cases.find((c) => c.id === copied)?.label} to the clipboard.</StatusMessage>
        ) : (
          <StatusMessage tone="idle">
            Every case updates as you type. Code cases (camelCase and below) convert each line separately.
          </StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <PanelSection
          title="Your text"
          actions={
            <>
              <IconButton icon={Sparkles} label="Load sample" size="sm" onClick={() => setText(SAMPLE)} />
              <IconButton icon={Eraser} label="Clear" size="sm" disabled={!text} onClick={() => setText("")} />
            </>
          }
        >
          <label htmlFor="case-input" className="sr-only">
            Text to convert
          </label>
          <textarea
            id="case-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type or paste text…"
            spellCheck={false}
            className="block min-h-72 w-full resize-y bg-surface p-4 font-mono text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus-visible:outline-none lg:min-h-[30rem]"
          />
        </PanelSection>
        <PanelSection title="Results">
          <ul className="divide-y divide-border bg-surface">
            {results.map((r) => (
              <li key={r.id} className="group flex items-start gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-fg-subtle">{r.label}</p>
                  <p className="mt-0.5 line-clamp-3 font-mono text-sm break-words whitespace-pre-wrap text-fg">
                    {r.value || <span className="text-fg-subtle">—</span>}
                  </p>
                </div>
                <IconButton
                  icon={copied === r.id ? Check : Copy}
                  label={copied === r.id ? "Copied" : `Copy ${r.label}`}
                  size="sm"
                  disabled={!r.value}
                  onClick={() => copy(r.value, r.id)}
                />
              </li>
            ))}
          </ul>
        </PanelSection>
      </div>
    </Panel>
  );
}
