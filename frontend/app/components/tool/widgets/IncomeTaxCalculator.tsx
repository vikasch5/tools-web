import { useState } from "react";
import { SelectField, TextField } from "~/components/ui/Field";
import { TAX_YEAR, compareRegimes, rules, type AgeGroup, type TaxBreakdown } from "~/tools/engine/income-tax";
import { inr } from "~/tools/engine/finance";
import { cn } from "~/lib/cn";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { num } from "./finance-shared";

const rows: { label: string; value: (b: TaxBreakdown) => string }[] = [
  { label: "Gross income", value: (b) => inr(b.grossIncome, true) },
  { label: "Deductions", value: (b) => `− ${inr(b.deductions, true)}` },
  { label: "Taxable income", value: (b) => inr(b.taxableIncome, true) },
  { label: "Tax on slabs", value: (b) => inr(b.slabTax, true) },
  { label: "Rebate (87A)", value: (b) => (b.rebate ? `− ${inr(b.rebate, true)}` : "–") },
  { label: "Surcharge", value: (b) => (b.surcharge ? inr(b.surcharge, true) : "–") },
  { label: "Cess (4%)", value: (b) => inr(b.cess, true) },
  { label: "Total tax", value: (b) => inr(b.totalTax, true) },
  { label: "Effective rate", value: (b) => `${b.effectiveRate}%` },
];

export function IncomeTaxCalculator() {
  const [age, setAge] = useState<AgeGroup>("below60");
  const [salary, setSalary] = useState("15,00,000");
  const [other, setOther] = useState("");
  const [c80, setC80] = useState("");
  const [d80, setD80] = useState("");
  const [nps, setNps] = useState("");
  const [hra, setHra] = useState("");
  const [homeLoan, setHomeLoan] = useState("");
  const [otherDed, setOtherDed] = useState("");
  const [employerNps, setEmployerNps] = useState("");

  const r = compareRegimes({
    age,
    salary: num(salary),
    otherIncome: num(other),
    section80C: num(c80),
    section80D: num(d80),
    nps: num(nps),
    hraExemption: num(hra),
    homeLoanInterest: num(homeLoan),
    otherDeductions: num(otherDed),
    employerNps: num(employerNps),
  });
  const ok = !("error" in r);

  const money = (label: string, value: string, set: (v: string) => void, hint?: string) => (
    <TextField label={label} hint={hint} suffix="₹" inputMode="decimal" placeholder="0" value={value} onChange={(e) => set(e.target.value)} />
  );

  return (
    <Panel
      status={
        !ok ? (
          <StatusMessage tone="error">{r.error}</StatusMessage>
        ) : r.better === "same" ? (
          <StatusMessage tone="success">Both regimes cost {inr(r.new.totalTax, true)} for {TAX_YEAR}.</StatusMessage>
        ) : (
          <StatusMessage tone="success">
            The {r.better} regime saves you {inr(r.saving, true)} a year ({inr(Math.round(r.saving / 12), true)} a month) for {TAX_YEAR}.
          </StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(17rem,1fr)_minmax(0,1.5fr)]">
        <div className="grid content-start gap-px bg-border">
          <PanelSection title="Income for the year">
            <div className="space-y-4 p-4">
              <SelectField label="Your age" value={age} onChange={(e) => setAge(e.target.value as AgeGroup)}>
                <option value="below60">Below 60</option>
                <option value="60to80">60 to 79</option>
                <option value="above80">80 or more</option>
              </SelectField>
              {money("Salary or pension (gross)", salary, setSalary, "Before standard deduction")}
              {money("Other income", other, setOther, "Interest, rent, freelance")}
              {money("Employer's NPS contribution", employerNps, setEmployerNps, "Both regimes")}
            </div>
          </PanelSection>
          <PanelSection title="Old regime deductions">
            <div className="space-y-4 p-4">
              {money("80C: PPF, ELSS, EPF, insurance…", c80, setC80, `Up to ${inr(rules.limits.section80C, true)}`)}
              {money("80D: health insurance", d80, setD80)}
              {money("80CCD(1B): your own NPS", nps, setNps, `Up to ${inr(rules.limits.nps80CCD1B, true)}`)}
              {money("Exempt HRA", hra, setHra, "From the HRA calculator")}
              {money("Home loan interest", homeLoan, setHomeLoan, `Up to ${inr(rules.limits.homeLoanInterest, true)}`)}
              {money("Other deductions", otherDed, setOtherDed, "80E, 80G, 80TTA…")}
            </div>
          </PanelSection>
        </div>
        <PanelSection title={`Tax for ${TAX_YEAR}`}>
          <div aria-live="polite">
            {ok ? (
              <>
                <div className="grid grid-cols-2 gap-px border-b border-border bg-border">
                  {(["new", "old"] as const).map((regime) => {
                    const b = r[regime];
                    const best = r.better === regime;
                    return (
                      <div key={regime} className={cn("bg-surface px-4 py-4", best && "bg-accent-soft")}>
                        <p className="text-xs text-fg-subtle">
                          {regime === "new" ? "New regime (default)" : "Old regime"}
                          {best && <span className="ml-1.5 font-semibold text-accent-fg">· lower</span>}
                        </p>
                        <p className="mt-0.5 font-display text-3xl font-semibold tracking-tight break-all text-fg tabular-nums">
                          {inr(b.totalTax, true)}
                        </p>
                        <p className="mt-1 text-xs text-fg-muted">{inr(Math.round(b.totalTax / 12), true)} a month</p>
                      </div>
                    );
                  })}
                </div>
                <table className="w-full text-sm tabular-nums">
                  <thead className="bg-surface-2 text-left text-xs text-fg-subtle">
                    <tr>
                      <th scope="col" className="px-4 py-2 font-medium">
                        <span className="sr-only">Item</span>
                      </th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">New</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">Old</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row) => (
                      <tr key={row.label} className={row.label === "Total tax" ? "font-semibold" : undefined}>
                        <th scope="row" className="px-4 py-2 text-left font-normal text-fg-muted">{row.label}</th>
                        <td className="px-4 py-2 text-right font-mono text-[0.8125rem] text-fg">{row.value(r.new)}</td>
                        <td className="px-4 py-2 text-right font-mono text-[0.8125rem] text-fg">{row.value(r.old)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-fg-muted">
                  Standard deduction: {inr(rules.new.standardDeduction, true)} new, {inr(rules.old.standardDeduction, true)} old.
                  Income up to {inr(rules.new.rebateUpTo, true)} taxable is tax-free in the new regime. Capital gains and other
                  special-rate income are not included. This is an estimate; check your final tax with a tax professional or
                  the income tax portal.
                </p>
              </>
            ) : (
              <p className="p-4 text-sm text-fg-muted">Your tax comparison appears here.</p>
            )}
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
