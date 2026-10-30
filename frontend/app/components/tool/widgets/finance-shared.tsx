import type { ReactNode } from "react";
import { inr, type GrowthYear } from "~/tools/engine/finance";
import { parseNumber } from "~/tools/engine/percent";
import { PanelSection } from "../Panel";

/** Empty input counts as 0; "1,50,000" and "150000" both work. */
export const num = (text: string) => (text.trim() ? parseNumber(text) : 0);

/** The main figure of a calculator, with a line of context under it. */
export function Headline({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="border-b border-border px-4 py-4">
      <p className="text-xs text-fg-subtle">{label}</p>
      <p className="mt-0.5 font-display text-4xl font-semibold tracking-tight break-all text-fg tabular-nums">{value}</p>
      {children && <p className="mt-1 text-sm text-fg-muted">{children}</p>}
    </div>
  );
}

/**
 * How a total splits into what you put in and what it earned. Each part is
 * labelled with its value, so the bar is never the only way to read it.
 */
export function SplitBar({ invested, earned, earnedLabel = "Returns" }: { invested: number; earned: number; earnedLabel?: string }) {
  const total = invested + earned;
  const share = total > 0 ? Math.round((invested / total) * 100) : 100;
  return (
    <div className="space-y-2 border-t border-border px-4 py-3">
      <div aria-hidden className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
        <div className="bg-fg-subtle" style={{ width: `${share}%` }} />
        <div className="bg-accent" style={{ width: `${100 - share}%` }} />
      </div>
      <p className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-fg-muted">
        <span>
          <span aria-hidden className="mr-1.5 inline-block size-2 rounded-full bg-fg-subtle" />
          Invested {share}%
        </span>
        <span>
          <span aria-hidden className="mr-1.5 inline-block size-2 rounded-full bg-accent" />
          {earnedLabel} {100 - share}%
        </span>
      </p>
    </div>
  );
}

/** Year-by-year growth, scrollable. */
export function GrowthTable({ years, earnedLabel = "Returns" }: { years: GrowthYear[]; earnedLabel?: string }) {
  return (
    <PanelSection title="Year by year" className="border-t border-border">
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-sm tabular-nums">
          <thead className="sticky top-0 bg-surface-2 text-left text-xs text-fg-subtle">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Year</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Invested</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">{earnedLabel}</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-[0.8125rem]">
            {years.map((y) => (
              <tr key={y.year}>
                <th scope="row" className="px-4 py-1.5 text-left font-normal text-fg-muted">{y.year}</th>
                <td className="px-4 py-1.5 text-right text-fg">{inr(y.invested, true)}</td>
                <td className="px-4 py-1.5 text-right text-fg">{inr(y.interest, true)}</td>
                <td className="px-4 py-1.5 text-right text-fg">{inr(y.balance, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PanelSection>
  );
}
