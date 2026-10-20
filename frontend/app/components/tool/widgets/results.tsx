import type { ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { useCopy } from "../Panel";

/** Two-column grid of big numbers, as in the Word Counter. */
export function StatGrid({ stats }: { stats: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px bg-border">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface px-4 py-3">
          <dt className="text-xs text-fg-subtle">{s.label}</dt>
          <dd className="mt-0.5 font-display text-2xl font-semibold tracking-tight text-fg tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Labelled values in monospace, each with its own copy button. */
export function CopyList({ items }: { items: { label: string; value: string }[] }) {
  const { copied, copy } = useCopy();
  return (
    <ul className="divide-y divide-border bg-surface">
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-fg-subtle">{item.label}</p>
            <p className="mt-0.5 font-mono text-sm break-all text-fg">{item.value || <span className="text-fg-subtle">—</span>}</p>
          </div>
          <IconButton
            icon={copied === item.label ? Check : Copy}
            label={copied === item.label ? "Copied" : `Copy ${item.label}`}
            size="sm"
            disabled={!item.value}
            onClick={() => copy(item.value, item.label)}
          />
        </li>
      ))}
    </ul>
  );
}
