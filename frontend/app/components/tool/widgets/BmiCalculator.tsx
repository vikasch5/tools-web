import { useState } from "react";
import { TextField } from "~/components/ui/Field";
import { calculateBmi, type BmiCategory, type BmiInput } from "~/tools/engine/bmi";
import { parseNumber } from "~/tools/engine/percent";
import { cn } from "~/lib/cn";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";

const bands: { category: BmiCategory; range: string }[] = [
  { category: "Underweight", range: "Below 18.5" },
  { category: "Healthy weight", range: "18.5 – 24.9" },
  { category: "Overweight", range: "25 – 29.9" },
  { category: "Obesity", range: "30 and above" },
];

export function BmiCalculator() {
  const [system, setSystem] = useState<"metric" | "imperial">("metric");
  const [kg, setKg] = useState("70");
  const [cm, setCm] = useState("175");
  const [lb, setLb] = useState("154");
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("9");

  const input: BmiInput =
    system === "metric"
      ? { system, weightKg: parseNumber(kg), heightCm: parseNumber(cm) }
      : { system, weightLb: parseNumber(lb), heightFt: parseNumber(ft), heightIn: parseNumber(inch || "0") };
  const r = calculateBmi(input);

  return (
    <Panel
      toolbar={
        <Segmented
          label="Units"
          value={system}
          onChange={(v) => setSystem(v as "metric" | "imperial")}
          choices={[
            { value: "metric", label: "Metric (kg, cm)" },
            { value: "imperial", label: "US (lb, ft, in)" },
          ]}
        />
      }
      status={
        r.ok ? (
          <StatusMessage tone="success">
            BMI {r.bmi.toFixed(1)}: {r.category.toLowerCase()} for adults.
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Your measurements">
          <div className="space-y-4 p-4">
            {system === "metric" ? (
              <>
                <TextField label="Weight" suffix="kg" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} />
                <TextField label="Height" suffix="cm" inputMode="decimal" value={cm} onChange={(e) => setCm(e.target.value)} />
              </>
            ) : (
              <>
                <TextField label="Weight" suffix="lb" inputMode="decimal" value={lb} onChange={(e) => setLb(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Height" suffix="ft" inputMode="numeric" value={ft} onChange={(e) => setFt(e.target.value)} />
                  <TextField label="and" suffix="in" inputMode="decimal" value={inch} onChange={(e) => setInch(e.target.value)} />
                </div>
              </>
            )}
            <p className="text-xs leading-relaxed text-fg-subtle">For adults 18 and over. Children and teens need age- and sex-specific BMI charts.</p>
          </div>
        </PanelSection>
        <PanelSection title="Result">
          <div aria-live="polite" className="p-4">
            {r.ok ? (
              <>
                <p className="font-display text-5xl font-semibold tracking-tight text-fg tabular-nums">{r.bmi.toFixed(1)}</p>
                <p className="mt-1 text-lg font-medium text-fg">{r.category}</p>
                <p className="mt-2 text-sm text-fg-muted">
                  A healthy weight for your height is {r.healthyRange.min}–{r.healthyRange.max} {r.healthyRange.unit} (BMI 18.5–24.9).
                </p>
              </>
            ) : (
              <p className="text-sm text-fg-muted">Your BMI appears here.</p>
            )}
            <ul className="mt-5 divide-y divide-border rounded-lg border border-border">
              {bands.map((band) => {
                const current = r.ok && r.category === band.category;
                return (
                  <li
                    key={band.category}
                    aria-current={current ? "true" : undefined}
                    className={cn("flex items-center justify-between gap-3 px-3 py-2 text-sm", current ? "bg-surface-2 font-semibold text-fg" : "text-fg-muted")}
                  >
                    <span>
                      {band.category}
                      {current && <span className="ml-2 label-mono text-accent-fg">You</span>}
                    </span>
                    <span className="font-mono text-xs tabular-nums">{band.range}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
