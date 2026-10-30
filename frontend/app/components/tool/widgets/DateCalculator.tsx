import { useState } from "react";
import { SelectField, TextField } from "~/components/ui/Field";
import { addDays, dateDifference, formatLongDate } from "~/tools/engine/everyday";
import { Segmented, Switch } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { StatGrid } from "./results";
import { Headline, num } from "./finance-shared";

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const n = (v: number) => v.toLocaleString("en-IN");
const plural = (v: number, one: string) => `${n(v)} ${v === 1 ? one : `${one}s`}`;

export function DateCalculator() {
  const [mode, setMode] = useState<"between" | "add">("between");
  const [start, setStart] = useState(todayIso);
  const [end, setEnd] = useState(() => `${new Date().getFullYear()}-12-31`);
  const [includeEnd, setIncludeEnd] = useState(false);
  const [amount, setAmount] = useState("30");
  const [unit, setUnit] = useState<"days" | "weeks" | "months" | "years">("days");
  const [direction, setDirection] = useState<"add" | "subtract">("add");

  const diff = dateDifference(start, end, includeEnd);
  const added = addDays(start, (direction === "add" ? 1 : -1) * Math.round(num(amount)), unit);

  return (
    <Panel
      toolbar={
        <Segmented
          label="Find"
          value={mode}
          onChange={(v) => setMode(v as "between" | "add")}
          choices={[
            { value: "between", label: "Days between dates" },
            { value: "add", label: "Add or subtract" },
          ]}
        />
      }
      status={
        mode === "between" ? (
          diff.ok ? (
            <StatusMessage tone="success">
              {plural(diff.totalDays, "day")} {includeEnd ? "including" : "from"} {formatLongDate(new Date(start + "T00:00:00Z"))} {includeEnd ? "to" : "until"} {formatLongDate(new Date(end + "T00:00:00Z"))}.
            </StatusMessage>
          ) : (
            <StatusMessage tone="error">{diff.message}</StatusMessage>
          )
        ) : added ? (
          <StatusMessage tone="success">The date is {formatLongDate(added)}.</StatusMessage>
        ) : (
          <StatusMessage tone="error">Enter a valid date and number.</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Dates">
          <div className="space-y-4 p-4">
            <TextField label={mode === "between" ? "Start date" : "Date"} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            {mode === "between" ? (
              <>
                <TextField label="End date" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
                <Switch label="Count the end date too (for leave or bookings)" checked={includeEnd} onChange={setIncludeEnd} />
              </>
            ) : (
              <>
                <Segmented
                  label="Do"
                  value={direction}
                  onChange={(v) => setDirection(v as "add" | "subtract")}
                  choices={[
                    { value: "add", label: "Add" },
                    { value: "subtract", label: "Subtract" },
                  ]}
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <SelectField label="Unit" value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)}>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </SelectField>
                </div>
              </>
            )}
          </div>
        </PanelSection>
        <PanelSection title="Result">
          <div aria-live="polite">
            {mode === "between" && diff.ok ? (
              <>
                <Headline label="Total" value={plural(diff.totalDays, "day")}>
                  {[diff.years && plural(diff.years, "year"), diff.months && plural(diff.months, "month"), plural(diff.days, "day")].filter(Boolean).join(", ")}
                </Headline>
                <StatGrid
                  stats={[
                    { label: "Weeks", value: `${n(diff.weeks)}${diff.weekDays ? ` + ${diff.weekDays} d` : ""}` },
                    { label: "Months (approx.)", value: n(Math.round((diff.totalDays / 30.4375) * 10) / 10) },
                    { label: "Working days (Mon–Fri)", value: n(diff.workingDays) },
                    { label: "Excluding Sundays", value: n(diff.sixDayWorkingDays) },
                  ]}
                />
                <p className="border-t border-border px-4 py-3 text-xs text-fg-muted">Public holidays are not taken out of the working days.</p>
              </>
            ) : mode === "add" && added ? (
              <Headline label={`${direction === "add" ? "After" : "Before"} ${amount} ${unit}`} value={formatLongDate(added)} />
            ) : (
              <p className="p-4 text-sm text-fg-muted">The result appears here.</p>
            )}
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
