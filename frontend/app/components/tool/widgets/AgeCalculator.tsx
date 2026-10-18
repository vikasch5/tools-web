import { useEffect, useState } from "react";
import { TextField } from "~/components/ui/Field";
import { calculateAge } from "~/tools/engine/age";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { StatGrid } from "./results";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const n = (v: number) => v.toLocaleString("en");
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function AgeCalculator() {
  const [birth, setBirth] = useState("1990-05-15");
  // Today's date is set after hydration, so server and client HTML match.
  const [on, setOn] = useState("");
  useEffect(() => setOn(today()), []);

  const r = on ? calculateAge(birth, on) : null;

  return (
    <Panel
      status={
        !r ? (
          <StatusMessage tone="idle">Enter a date of birth.</StatusMessage>
        ) : r.ok ? (
          <StatusMessage tone="success">
            {n(r.years)} years, {r.months} months and {r.days} days old on {longDate(on)}.
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Dates">
          <div className="space-y-4 p-4">
            <TextField label="Date of birth" type="date" value={birth} max={on || undefined} onChange={(e) => setBirth(e.target.value)} />
            <TextField label="Age on" hint="Defaults to today" type="date" value={on} onChange={(e) => setOn(e.target.value)} />
          </div>
        </PanelSection>
        <PanelSection title="Age">
          <div aria-live="polite">
            {r?.ok ? (
              <>
                <div className="border-b border-border px-4 py-4">
                  <p className="font-display text-4xl font-semibold tracking-tight text-fg tabular-nums">
                    {n(r.years)} <span className="text-xl text-fg-muted">years</span> {r.months}{" "}
                    <span className="text-xl text-fg-muted">months</span> {r.days} <span className="text-xl text-fg-muted">days</span>
                  </p>
                  <p className="mt-2 text-sm text-fg-muted">
                    {r.nextBirthday.daysUntil === 0
                      ? `Happy birthday! Turning ${r.nextBirthday.turning} today.`
                      : `Next birthday: ${r.nextBirthday.weekday}, ${longDate(r.nextBirthday.date)} (turning ${r.nextBirthday.turning}), in ${n(r.nextBirthday.daysUntil)} ${r.nextBirthday.daysUntil === 1 ? "day" : "days"}.`}
                  </p>
                </div>
                <StatGrid
                  stats={[
                    { label: "Total months", value: n(r.totalMonths) },
                    { label: "Total weeks", value: n(r.totalWeeks) },
                    { label: "Total days", value: n(r.totalDays) },
                    { label: "Total hours (approx.)", value: n(r.totalDays * 24) },
                  ]}
                />
              </>
            ) : (
              <p className="p-4 text-sm text-fg-muted">Your exact age appears here.</p>
            )}
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
