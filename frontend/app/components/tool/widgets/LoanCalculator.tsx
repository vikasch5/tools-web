import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { SelectField, TextField } from "~/components/ui/Field";
import {
  calculateLoan,
  calculatePrepayments,
  formatMonths,
  scheduleCsv,
  type PrepaymentMode,
} from "~/tools/engine/loan";
import { parseNumber } from "~/tools/engine/percent";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage, downloadBlob } from "../Panel";
import { StatGrid } from "./results";
import type { WidgetProps } from "./index";

const optional = (text: string) => (text.trim() ? parseNumber(text) : 0);

export function LoanCalculator({ preset }: WidgetProps) {
  // Landing pages (home, car loan…) start with their own example and format
  // amounts the Indian way (12,34,567.00).
  const locale = String(preset?.locale ?? "en");
  const symbol = String(preset?.currency ?? "");
  const money = (n: number) =>
    symbol + n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const [amount, setAmount] = useState(String(preset?.amount ?? "250,000"));
  const [rate, setRate] = useState(String(preset?.rate ?? "6.5"));
  const [term, setTerm] = useState(String(preset?.years ?? "25"));
  const [unit, setUnit] = useState<"years" | "months">("years");
  const [extra, setExtra] = useState("");
  const [yearly, setYearly] = useState("");
  const [yearlyFrom, setYearlyFrom] = useState("1");
  const [oneTime, setOneTime] = useState("");
  const [oneTimeMonth, setOneTimeMonth] = useState("12");
  const [mode, setMode] = useState<PrepaymentMode>("tenure");
  const [view, setView] = useState<"year" | "month">("year");

  const termValue = parseNumber(term);
  const months = unit === "years" ? Math.round(termValue * 12) : termValue;
  const loan = { principal: parseNumber(amount), annualRate: parseNumber(rate), months };
  const base = calculateLoan(loan);
  const prepaying = [extra, yearly, oneTime].some((v) => optional(v) > 0);
  const r = calculatePrepayments({
    ...loan,
    extraMonthly: optional(extra),
    yearly: optional(yearly),
    yearlyFromMonth: Number(yearlyFrom) * 12,
    oneTime: optional(oneTime),
    oneTimeMonth: Math.round(optional(oneTimeMonth)) || 1,
    mode,
  });
  const error = !base.ok ? base.message : !r.ok ? r.message : "";
  const interestShare = r.ok && r.totalPaid > 0 ? Math.round((r.totalInterest / r.totalPaid) * 100) : 0;
  const yearsInTerm = Math.max(1, Math.ceil(months / 12) || 1);

  return (
    <Panel
      status={
        error ? (
          <StatusMessage tone="error">{error}</StatusMessage>
        ) : r.ok && prepaying ? (
          <StatusMessage tone="success">
            Prepaying saves {money(r.interestSaved)} in interest
            {mode === "tenure" ? ` and ends the loan ${formatMonths(r.monthsSaved)} early.` : `; after the last prepayment the EMI is ${money(r.finalPayment)}.`}
          </StatusMessage>
        ) : (
          <StatusMessage tone="success">
            {months} monthly payments of {r.ok ? money(r.payment) : ""}.{symbol ? "" : " Works with any currency."}
          </StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <div className="grid gap-px bg-border">
          <PanelSection title="Loan">
            <div className="space-y-4 p-4">
              <TextField label="Loan amount" suffix={symbol || undefined} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
          <PanelSection title="Prepayments (optional)">
            <div className="space-y-4 p-4">
              <TextField label="Extra every month" inputMode="decimal" placeholder="0" value={extra} onChange={(e) => setExtra(e.target.value)} />
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <TextField label="Once a year" inputMode="decimal" placeholder="0" value={yearly} onChange={(e) => setYearly(e.target.value)} />
                <SelectField label="From" value={yearlyFrom} onChange={(e) => setYearlyFrom(e.target.value)} className="w-28">
                  {Array.from({ length: Math.min(yearsInTerm, 50) }, (_, i) => (
                    <option key={i} value={i + 1}>
                      Year {i + 1}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <TextField label="One-time" inputMode="decimal" placeholder="0" value={oneTime} onChange={(e) => setOneTime(e.target.value)} />
                <TextField label="In month" inputMode="numeric" value={oneTimeMonth} onChange={(e) => setOneTimeMonth(e.target.value)} className="w-28" />
              </div>
              <Segmented
                label="Use it to"
                value={mode}
                onChange={(v) => setMode(v as PrepaymentMode)}
                choices={[
                  { value: "tenure", label: "Finish sooner" },
                  { value: "emi", label: "Lower the EMI" },
                ]}
              />
            </div>
          </PanelSection>
        </div>
        <PanelSection title="Repayments">
          <div aria-live="polite">
            {r.ok && base.ok ? (
              <>
                <div className="border-b border-border px-4 py-4">
                  <p className="text-xs text-fg-subtle">Monthly payment (EMI)</p>
                  <p className="mt-0.5 font-display text-4xl font-semibold tracking-tight text-fg tabular-nums">{money(r.payment)}</p>
                  {prepaying && mode === "emi" && r.finalPayment < r.payment - 0.005 && (
                    <p className="mt-1 text-sm text-fg-muted">
                      Drops after each prepayment, to <span className="font-semibold text-fg tabular-nums">{money(r.finalPayment)}</span> after the last one.
                    </p>
                  )}
                </div>
                <StatGrid
                  stats={
                    prepaying
                      ? [
                          { label: "Interest saved", value: money(r.interestSaved) },
                          { label: "Paid off in", value: formatMonths(r.months) },
                          { label: "Total interest", value: money(r.totalInterest) },
                          { label: "Without prepaying", value: money(base.totalInterest) },
                        ]
                      : [
                          { label: "Total interest", value: money(r.totalInterest) },
                          { label: "Total paid", value: money(r.totalPaid) },
                        ]
                  }
                />
                <p className="border-t border-border px-4 py-3 text-sm text-fg-muted">
                  Interest is {interestShare}% of everything you repay
                  {prepaying ? `, and you prepay ${money(r.totalPrepaid)} in total.` : "."}
                </p>
              </>
            ) : (
              <p className="p-4 text-sm text-fg-muted">Your repayments appear here.</p>
            )}
          </div>
        </PanelSection>
      </div>
      {r.ok && (
        <PanelSection
          title="Schedule"
          className="border-t border-border"
          actions={
            <div className="flex items-center gap-2">
              <Segmented
                label="Show"
                value={view}
                onChange={(v) => setView(v as "year" | "month")}
                choices={[
                  { value: "year", label: "Yearly" },
                  { value: "month", label: "Monthly" },
                ]}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={Download}
                onClick={() => downloadBlob(new Blob([scheduleCsv(r.schedule)], { type: "text/csv" }), "emi-schedule.csv")}
              >
                CSV
              </Button>
            </div>
          }
        >
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="sticky top-0 bg-surface-2 text-left text-xs text-fg-subtle">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">{view === "year" ? "Year" : "Month"}</th>
                  {view === "month" && <th scope="col" className="px-4 py-2 text-right font-medium">EMI</th>}
                  <th scope="col" className="px-4 py-2 text-right font-medium">Principal paid</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Interest paid</th>
                  {view === "month" && prepaying && <th scope="col" className="px-4 py-2 text-right font-medium">Prepaid</th>}
                  <th scope="col" className="px-4 py-2 text-right font-medium">Balance left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-[0.8125rem]">
                {view === "year"
                  ? r.years.map((y) => (
                      <tr key={y.year}>
                        <th scope="row" className="px-4 py-1.5 text-left font-normal text-fg-muted">{y.year}</th>
                        <td className="px-4 py-1.5 text-right text-fg">{money(y.principal)}</td>
                        <td className="px-4 py-1.5 text-right text-fg">{money(y.interest)}</td>
                        <td className="px-4 py-1.5 text-right text-fg">{money(y.balance)}</td>
                      </tr>
                    ))
                  : r.schedule.map((m) => (
                      <tr key={m.month}>
                        <th scope="row" className="px-4 py-1.5 text-left font-normal text-fg-muted">{m.month}</th>
                        <td className="px-4 py-1.5 text-right text-fg">{money(m.emi)}</td>
                        <td className="px-4 py-1.5 text-right text-fg">{money(m.principal)}</td>
                        <td className="px-4 py-1.5 text-right text-fg">{money(m.interest)}</td>
                        {prepaying && <td className="px-4 py-1.5 text-right text-fg">{m.prepayment ? money(m.prepayment) : "–"}</td>}
                        <td className="px-4 py-1.5 text-right text-fg">{money(m.balance)}</td>
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
