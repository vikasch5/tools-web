import { useState } from "react";
import { TextField } from "~/components/ui/Field";
import { cmToFeet, decimalFeetReadings, feetToCm } from "~/tools/engine/height";
import { parseNumber } from "~/tools/engine/percent";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";

type Direction = "to-cm" | "to-feet";

export function HeightConverter() {
  const [direction, setDirection] = useState<Direction>("to-cm");
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("8");
  const [cm, setCm] = useState("170");

  const toCm = direction === "to-cm";
  const r = toCm ? feetToCm(parseNumber(ft || "0"), parseNumber(inch || "0")) : cmToFeet(parseNumber(cm));
  // "5.8" in the feet box with no inches: show both readings.
  const readings = toCm && !inch.trim() ? decimalFeetReadings(ft) : undefined;

  return (
    <Panel
      toolbar={
        <Segmented
          label="Convert"
          value={direction}
          onChange={(v) => setDirection(v as Direction)}
          choices={[
            { value: "to-cm", label: "Feet → cm" },
            { value: "to-feet", label: "cm → feet" },
          ]}
        />
      }
      status={
        r.ok ? (
          <StatusMessage tone="success">
            {r.feet.ft} ft {r.feet.in} in = {r.cm} cm
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Height">
          <div className="space-y-4 p-4">
            {toCm ? (
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Feet" suffix="ft" inputMode="decimal" value={ft} onChange={(e) => setFt(e.target.value)} />
                <TextField label="Inches" suffix="in" inputMode="decimal" value={inch} onChange={(e) => setInch(e.target.value)} />
              </div>
            ) : (
              <TextField label="Centimetres" suffix="cm" inputMode="decimal" value={cm} onChange={(e) => setCm(e.target.value)} />
            )}
            <p className="text-xs leading-relaxed text-fg-subtle">
              1 inch = 2.54 cm exactly, 1 foot = 30.48 cm. For 5 ft 8 in, type 5 and 8. A decimal like 5.8 with the inches box
              empty shows both ways of reading it.
            </p>
          </div>
        </PanelSection>
        <PanelSection title="Result">
          <div aria-live="polite" className="space-y-4 p-4">
            {r.ok ? (
              <>
                <div>
                  <p className="font-display text-5xl font-semibold tracking-tight text-fg tabular-nums">
                    {toCm ? `${r.cm} cm` : `${r.feet.ft} ft ${r.feet.in} in`}
                  </p>
                  <p className="mt-2 text-sm text-fg-muted tabular-nums">
                    {toCm ? `${r.m} m · ${r.totalInches} inches in total` : `${r.totalInches} inches in total · ${r.m} m`}
                  </p>
                </div>
                {readings?.shorthand && (
                  <div className="rounded-lg border border-border p-3 text-sm text-fg-muted">
                    <p className="font-medium text-fg">Did you mean {readings.shorthand.feet.ft} ft {readings.shorthand.inches} in?</p>
                    <ul className="mt-2 space-y-1 tabular-nums">
                      <li>
                        {ft} ft as a decimal = {readings.decimal.feet.ft} ft {readings.decimal.feet.in} in = {readings.decimal.cm} cm
                      </li>
                      <li>
                        {readings.shorthand.feet.ft} ft {readings.shorthand.inches} in = {readings.shorthand.cm} cm
                      </li>
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-fg-muted">The height in the other unit appears here.</p>
            )}
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
