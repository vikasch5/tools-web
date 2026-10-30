import { useState } from "react";
import { TextField } from "~/components/ui/Field";
import { GRATUITY_TAX_FREE, calculateGratuity, inr } from "~/tools/engine/finance";
import { Segmented, Switch } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { StatGrid } from "./results";
import { Headline, num } from "./finance-shared";

export function GratuityCalculator() {
  const [wages, setWages] = useState("50,000");
  const [years, setYears] = useState("10");
  const [months, setMonths] = useState("0");
  const [covered, setCovered] = useState<"yes" | "no">("yes");
  const [fixedTerm, setFixedTerm] = useState(false);

  const r = calculateGratuity({
    wages: num(wages),
    years: Math.round(num(years)),
    months: Math.round(num(months)),
    covered: covered === "yes",
    fixedTerm,
  });

  return (
    <Panel
      status={
        !r.ok ? (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        ) : !r.eligible ? (
          <StatusMessage tone="warning">{r.reason}</StatusMessage>
        ) : (
          <StatusMessage tone="success">
            {inr(num(wages))} × {covered === "yes" ? "15/26" : "15/30"} × {r.countedYears} years = {inr(r.amount)}.
          </StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Your service">
          <div className="space-y-4 p-4">
            <TextField label="Last monthly basic + DA" suffix="₹" inputMode="decimal" value={wages} onChange={(e) => setWages(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Years of service" inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} />
              <TextField label="and months" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} />
            </div>
            <Segmented
              label="Covered by the Act"
              value={covered}
              onChange={(v) => setCovered(v as "yes" | "no")}
              choices={[
                { value: "yes", label: "Yes (10+ staff)" },
                { value: "no", label: "No" },
              ]}
            />
            <Switch label="Fixed-term employee" checked={fixedTerm} onChange={setFixedTerm} />
            <p className="text-xs leading-relaxed text-fg-subtle">
              Under the new labour codes, basic + DA must be at least half of your total pay. If yours is lower, enter half
              your monthly pay instead.
            </p>
          </div>
        </PanelSection>
        <PanelSection title="Gratuity">
          <div aria-live="polite">
            {r.ok && r.eligible ? (
              <>
                <Headline label="Gratuity payable" value={inr(r.amount)}>
                  For {r.countedYears} {r.countedYears === 1 ? "year" : "years"} of service
                  {covered === "yes" && Math.round(num(months)) >= 6 ? " (6+ months round up to a full year)" : ""}.
                </Headline>
                <StatGrid
                  stats={[
                    { label: "Tax-free", value: inr(r.taxFree) },
                    { label: "Taxable", value: inr(r.taxable) },
                  ]}
                />
                <p className="border-t border-border px-4 py-3 text-sm text-fg-muted">
                  Private-sector employees get up to {inr(GRATUITY_TAX_FREE, true)} tax-free in their lifetime; government
                  employees' gratuity is fully exempt.
                </p>
              </>
            ) : (
              <p className="p-4 text-sm text-fg-muted">{r.ok ? "Not yet eligible." : "Your gratuity appears here."}</p>
            )}
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
