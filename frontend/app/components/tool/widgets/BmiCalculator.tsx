import { useState } from "react";
import { TextField } from "~/components/ui/Field";
import { bmiScales, calculateBmi, splitFeet, type BmiInput, type BmiScale, type BmiSystem } from "~/tools/engine/bmi";
import { parseNumber } from "~/tools/engine/percent";
import { cn } from "~/lib/cn";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";

export function BmiCalculator() {
  const [system, setSystem] = useState<BmiSystem>("metric");
  const [scale, setScale] = useState<BmiScale>("who");
  const [kg, setKg] = useState("70");
  const [cm, setCm] = useState("175");
  const [lb, setLb] = useState("154");
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("9");

  const feet = { heightFt: parseNumber(ft), heightIn: parseNumber(inch || "0") };
  const input: BmiInput =
    system === "metric"
      ? { system, scale, weightKg: parseNumber(kg), heightCm: parseNumber(cm) }
      : system === "mixed"
        ? { system, scale, weightKg: parseNumber(kg), ...feet }
        : { system, scale, weightLb: parseNumber(lb), ...feet };
  const r = calculateBmi(input);
  const bands = bmiScales[scale].bands;

  // "5.8" in the feet box means 5.8 feet (5 ft 9.6 in), not 5 ft 8 in.
  const decimalFeet = system !== "metric" && /[.,]\d/.test(ft) && !inch.trim().replace(/^0+$/, "");
  const decimalAs = decimalFeet ? splitFeet(parseNumber(ft) * 12) : undefined;
  const heightLine = r.ok
    ? system === "metric"
      ? `Height ${r.height.cm} cm = ${r.height.ft} ft ${r.height.in} in`
      : `Height ${r.height.ft} ft ${r.height.in} in = ${r.height.cm} cm`
    : undefined;

  const heightFields = (
    <div className="grid grid-cols-2 gap-3">
      <TextField label="Height" suffix="ft" inputMode="decimal" value={ft} onChange={(e) => setFt(e.target.value)} />
      <TextField label="and" suffix="in" inputMode="decimal" value={inch} onChange={(e) => setInch(e.target.value)} />
    </div>
  );

  return (
    <Panel
      toolbar={
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Segmented
            label="Units"
            value={system}
            onChange={(v) => setSystem(v as BmiSystem)}
            choices={[
              { value: "metric", label: "kg, cm" },
              { value: "mixed", label: "kg, ft/in" },
              { value: "imperial", label: "lb, ft/in" },
            ]}
          />
          <Segmented
            label="Ranges"
            value={scale}
            onChange={(v) => setScale(v as BmiScale)}
            choices={[
              { value: "who", label: "WHO" },
              { value: "asian", label: "Asian" },
            ]}
          />
        </div>
      }
      status={
        r.ok ? (
          <StatusMessage tone="success">
            BMI {r.bmi.toFixed(1)}: {r.category.toLowerCase()} for adults ({bmiScales[scale].label} ranges).
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Your measurements">
          <div className="space-y-4 p-4">
            {system === "imperial" ? (
              <TextField label="Weight" suffix="lb" inputMode="decimal" value={lb} onChange={(e) => setLb(e.target.value)} />
            ) : (
              <TextField label="Weight" suffix="kg" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} />
            )}
            {system === "metric" ? (
              <TextField label="Height" suffix="cm" inputMode="decimal" value={cm} onChange={(e) => setCm(e.target.value)} />
            ) : (
              heightFields
            )}
            {decimalAs && (
              <p className="text-xs leading-relaxed text-fg-muted">
                {ft} ft is {decimalAs.ft} ft {decimalAs.in} in. For {Math.trunc(parseNumber(ft))} ft{" "}
                {ft.split(/[.,]/)[1]} in, enter {Math.trunc(parseNumber(ft))} and {ft.split(/[.,]/)[1]}.
              </p>
            )}
            <p className="text-xs leading-relaxed text-fg-subtle">
              For adults 18 and over. Children and teens need age- and sex-specific BMI charts. Asian ranges are the WHO
              Asia-Pacific cut-offs used in India.
            </p>
          </div>
        </PanelSection>
        <PanelSection title="Result">
          <div aria-live="polite" className="p-4">
            {r.ok ? (
              <>
                <p className="font-display text-5xl font-semibold tracking-tight text-fg tabular-nums">{r.bmi.toFixed(1)}</p>
                <p className="mt-1 text-lg font-medium text-fg">{r.category}</p>
                <p className="mt-2 text-sm text-fg-muted">
                  A healthy weight for your height is {r.healthyRange.min}–{r.healthyRange.max} {r.healthyRange.unit} (BMI 18.5–
                  {bmiScales[scale].healthyMax}).
                </p>
                <p className="mt-1 text-xs text-fg-subtle tabular-nums">{heightLine}</p>
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
