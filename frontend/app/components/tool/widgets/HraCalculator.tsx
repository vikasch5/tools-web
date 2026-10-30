import { useState } from "react";
import { TextField } from "~/components/ui/Field";
import { calculateHra, hraCities, inr } from "~/tools/engine/finance";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { StatGrid } from "./results";
import { Headline, num } from "./finance-shared";

export function HraCalculator() {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [salary, setSalary] = useState("50,000");
  const [hra, setHra] = useState("20,000");
  const [rent, setRent] = useState("18,000");
  const [city, setCity] = useState<"big" | "other">("big");

  const k = period === "month" ? 12 : 1;
  const r = calculateHra({ salary: num(salary) * k, hra: num(hra) * k, rent: num(rent) * k, bigCity: city === "big" });
  const least = r.ok ? Math.min(r.limits.received, r.limits.rentOverTenPercent, r.limits.salaryShare) : 0;
  const mark = (n: number) => (r.ok && n === least ? " ← least, exempt" : "");

  return (
    <Panel
      status={
        r.ok ? (
          <StatusMessage tone="success">
            {inr(r.exempt, true)} of your HRA is tax-free each year under the old tax regime.
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Salary and rent">
          <div className="space-y-4 p-4">
            <Segmented
              label="Amounts per"
              value={period}
              onChange={(v) => setPeriod(v as "month" | "year")}
              choices={[
                { value: "month", label: "Month" },
                { value: "year", label: "Year" },
              ]}
            />
            <TextField label="Basic pay + DA" suffix="₹" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} />
            <TextField label="HRA received" suffix="₹" inputMode="decimal" value={hra} onChange={(e) => setHra(e.target.value)} />
            <TextField label="Rent paid" suffix="₹" inputMode="decimal" value={rent} onChange={(e) => setRent(e.target.value)} />
            <Segmented
              label="You live in"
              value={city}
              onChange={(v) => setCity(v as "big" | "other")}
              choices={[
                { value: "big", label: "One of 8 cities" },
                { value: "other", label: "Elsewhere" },
              ]}
            />
            <p className="text-xs leading-relaxed text-fg-subtle">50% applies in {hraCities.join(", ")} (from April 2026); 40% elsewhere.</p>
          </div>
        </PanelSection>
        <PanelSection title="Exemption">
          <div aria-live="polite">
            {r.ok ? (
              <>
                <Headline label="Tax-free HRA per year" value={inr(r.exempt, true)}>
                  {inr(Math.round(r.exempt / 12), true)} a month. Taxable HRA: {inr(r.taxable, true)} a year.
                </Headline>
                <StatGrid
                  stats={[
                    { label: `HRA received${mark(r.limits.received)}`, value: inr(r.limits.received, true) },
                    { label: `Rent − 10% of salary${mark(r.limits.rentOverTenPercent)}`, value: inr(r.limits.rentOverTenPercent, true) },
                    { label: `${city === "big" ? 50 : 40}% of salary${mark(r.limits.salaryShare)}`, value: inr(r.limits.salaryShare, true) },
                    { label: "Taxable HRA", value: inr(r.taxable, true) },
                  ]}
                />
                <p className="border-t border-border px-4 py-3 text-sm text-fg-muted">
                  The new tax regime, the default, does not allow an HRA exemption. Rent over ₹1 lakh a year needs your
                  landlord's PAN.
                </p>
              </>
            ) : (
              <p className="p-4 text-sm text-fg-muted">Your HRA exemption appears here.</p>
            )}
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
