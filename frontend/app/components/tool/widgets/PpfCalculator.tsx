import { useState } from "react";
import { SelectField, TextField } from "~/components/ui/Field";
import { PPF_RATE, calculatePpf, inr } from "~/tools/engine/finance";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { StatGrid } from "./results";
import { GrowthTable, Headline, SplitBar, num } from "./finance-shared";

export function PpfCalculator() {
  const [yearly, setYearly] = useState("1,50,000");
  const [rate, setRate] = useState(String(PPF_RATE));
  const [years, setYears] = useState("15");
  const r = calculatePpf(num(yearly), num(rate), Number(years));

  return (
    <Panel
      status={
        r.ok ? (
          <StatusMessage tone="success">
            {inr(num(yearly), true)} a year for {years} years grows to {inr(r.total, true)}, tax-free.
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Deposits">
          <div className="space-y-4 p-4">
            <TextField label="Deposit every year" hint="₹500 – ₹1,50,000" suffix="₹" inputMode="decimal" value={yearly} onChange={(e) => setYearly(e.target.value)} />
            <TextField label="Interest rate" hint={`${PPF_RATE}% for Oct–Dec 2026`} suffix="%" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
            <SelectField label="Keep the account for" value={years} onChange={(e) => setYears(e.target.value)}>
              <option value="15">15 years (full term)</option>
              <option value="20">20 years (1 extension)</option>
              <option value="25">25 years (2 extensions)</option>
              <option value="30">30 years (3 extensions)</option>
            </SelectField>
            <p className="text-xs leading-relaxed text-fg-subtle">
              Assumes each deposit is made before 5 April, so it earns interest for the whole year. The government reviews
              the rate every quarter.
            </p>
          </div>
        </PanelSection>
        <PanelSection title="Maturity">
          <div aria-live="polite">
            {r.ok ? (
              <>
                <Headline label="Maturity value" value={inr(r.total, true)} />
                <StatGrid
                  stats={[
                    { label: "Total deposited", value: inr(r.invested, true) },
                    { label: "Interest earned", value: inr(r.returns, true) },
                  ]}
                />
                <SplitBar invested={r.invested} earned={r.returns} earnedLabel="Interest" />
              </>
            ) : (
              <p className="p-4 text-sm text-fg-muted">Your PPF maturity value appears here.</p>
            )}
          </div>
        </PanelSection>
      </div>
      {r.ok && <GrowthTable years={r.years} earnedLabel="Interest" />}
    </Panel>
  );
}
