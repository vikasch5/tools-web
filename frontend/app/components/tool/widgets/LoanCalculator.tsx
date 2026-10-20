import { useState } from "react";
import { TextField } from "~/components/ui/Field";
import { calculateLoan, money } from "~/tools/engine/loan";
import { parseNumber } from "~/tools/engine/percent";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { StatGrid } from "./results";

export function LoanCalculator() {
  const [amount, setAmount] = useState("250,000");
  const [rate, setRate] = useState("6.5");
  const [term, setTerm] = useState("25");
  const [unit, setUnit] = useState<"years" | "months">("years");

  const termValue = parseNumber(term);
  const months = unit === "years" ? Math.round(termValue * 12) : termValue;
  const r = calculateLoan({ principal: parseNumber(amount), annualRate: parseNumber(rate), months });
  const interestShare = r.ok && r.totalPaid > 0 ? Math.round((r.totalInterest / r.totalPaid) * 100) : 0;

  return (
    <Panel
      status={
        r.ok ? (
          <StatusMessage tone="success">
            {months} monthly payments of {money(r.payment)}. Works with any currency.
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Loan">
          <div className="space-y-4 p-4">
            <TextField label="Loan amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <TextField label="Interest rate" hint="Per year" suffix="%" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
            <div className="space-y-2">
              <TextField label="Term" inputMode="numeric" value={term} onChange={(e) => setTerm(e.target.value)} />
              <Segmented
                label="In"
                value={unit}
                onChange={(v) => setUnit(v as "years" | "months")}
                choices={[
                  { value: "years", label: "Years" },
                  { value: "months", label: "Months" },
                ]}
              />
            </div>
          </div>
        </PanelSection>
        <PanelSection title="Repayments">
          <div aria-live="polite">
            {r.ok ? (
              <>
                <div className="border-b border-border px-4 py-4">
                  <p className="text-xs text-fg-subtle">Monthly payment (EMI)</p>
                  <p className="mt-0.5 font-display text-4xl font-semibold tracking-tight text-fg tabular-nums">{money(r.payment)}</p>
                </div>
                <StatGrid
                  stats={[
                    { label: "Total interest", value: money(r.totalInterest) },
                    { label: "Total paid", value: money(r.totalPaid) },
                  ]}
                />
                <p className="border-t border-border px-4 py-3 text-sm text-fg-muted">
                  Interest is {interestShare}% of everything you repay.
                </p>
              </>
            ) : (
              <p className="p-4 text-sm text-fg-muted">Your repayments appear here.</p>
            )}
          </div>
        </PanelSection>
      </div>
      {r.ok && (
        <PanelSection title="Schedule by year" className="border-t border-border">
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="sticky top-0 bg-surface-2 text-left text-xs text-fg-subtle">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Year</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Principal paid</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Interest paid</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Balance left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-[0.8125rem]">
                {r.schedule.map((y) => (
                  <tr key={y.year}>
                    <th scope="row" className="px-4 py-1.5 text-left font-normal text-fg-muted">{y.year}</th>
                    <td className="px-4 py-1.5 text-right text-fg">{money(y.principal)}</td>
                    <td className="px-4 py-1.5 text-right text-fg">{money(y.interest)}</td>
                    <td className="px-4 py-1.5 text-right text-fg">{money(y.balance)}</td>
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
