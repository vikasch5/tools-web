import { useState } from "react";
import { SelectField, TextField } from "~/components/ui/Field";
import { calculateCompound, compoundings, inr, type Compounding } from "~/tools/engine/finance";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { StatGrid } from "./results";
import { GrowthTable, Headline, SplitBar, num } from "./finance-shared";
import type { WidgetProps } from "./index";

/**
 * Fixed deposit by default; with the "compound" preset it becomes a general
 * compound interest calculator with monthly additions.
 */
export function FdCalculator({ preset }: WidgetProps) {
  const general = preset?.kind === "compound";
  const [principal, setPrincipal] = useState(general ? "1,00,000" : "1,00,000");
  const [monthly, setMonthly] = useState("");
  const [rate, setRate] = useState(general ? "8" : "7");
  const [term, setTerm] = useState(general ? "10" : "5");
  const [unit, setUnit] = useState<"years" | "months">("years");
  const [compounding, setCompounding] = useState<Compounding>(general ? "yearly" : "quarterly");

  const months = Math.round(unit === "years" ? num(term) * 12 : num(term));
  const r = calculateCompound(num(principal), num(rate), months, compounding, general ? num(monthly) : 0);
  const quarterlyPayout = !general && r.ok ? (num(principal) * num(rate)) / 400 : 0;

  return (
    <Panel
      status={
        r.ok ? (
          <StatusMessage tone="success">
            {general ? "Grows to" : "Matures at"} {inr(r.maturity)} after {months} months, an effective {r.effectiveRate}% a year.
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title={general ? "Investment" : "Deposit"}>
          <div className="space-y-4 p-4">
            <TextField label={general ? "Starting amount" : "Deposit amount"} suffix="₹" inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
            {general && (
              <TextField label="Add every month" hint="Optional" suffix="₹" inputMode="decimal" placeholder="0" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
            )}
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
            <SelectField label="Interest added" value={compounding} onChange={(e) => setCompounding(e.target.value as Compounding)}>
              {(Object.keys(compoundings) as Compounding[]).map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                  {!general && c === "quarterly" ? " (most banks)" : ""}
                </option>
              ))}
            </SelectField>
          </div>
        </PanelSection>
        <PanelSection title="Result">
          <div aria-live="polite">
            {r.ok ? (
              <>
                <Headline label={general ? "Final value" : "Maturity amount"} value={inr(r.maturity)} />
                <StatGrid
                  stats={[
                    { label: "Invested", value: inr(r.invested) },
                    { label: "Interest earned", value: inr(r.interest) },
                  ]}
                />
                <SplitBar invested={r.invested} earned={r.interest} earnedLabel="Interest" />
                {!general && (
                  <p className="border-t border-border px-4 py-3 text-sm text-fg-muted">
                    With a quarterly payout instead, you would receive about {inr(quarterlyPayout)} every quarter and get{" "}
                    {inr(num(principal))} back at the end. Tax on FD interest is not included.
                  </p>
                )}
              </>
            ) : (
              <p className="p-4 text-sm text-fg-muted">The maturity amount appears here.</p>
            )}
          </div>
        </PanelSection>
      </div>
      {r.ok && <GrowthTable years={r.years} earnedLabel="Interest" />}
    </Panel>
  );
}
