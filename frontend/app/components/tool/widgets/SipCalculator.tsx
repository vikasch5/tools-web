import { useState } from "react";
import { TextField } from "~/components/ui/Field";
import { calculateLumpsum, calculateSip, inr } from "~/tools/engine/finance";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { StatGrid } from "./results";
import { GrowthTable, Headline, SplitBar, num } from "./finance-shared";

export function SipCalculator() {
  const [mode, setMode] = useState<"sip" | "lumpsum">("sip");
  const [amount, setAmount] = useState("10,000");
  const [lump, setLump] = useState("1,00,000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("10");
  const [stepUp, setStepUp] = useState("");

  const r =
    mode === "sip"
      ? calculateSip(num(amount), num(rate), Math.round(num(years)), num(stepUp))
      : calculateLumpsum(num(lump), num(rate), Math.round(num(years)));

  return (
    <Panel
      toolbar={
        <Segmented
          label="Invest"
          value={mode}
          onChange={(v) => setMode(v as "sip" | "lumpsum")}
          choices={[
            { value: "sip", label: "Monthly (SIP)" },
            { value: "lumpsum", label: "One time (lump sum)" },
          ]}
        />
      }
      status={
        r.ok ? (
          <StatusMessage tone="success">
            In {Math.round(num(years))} years: about {inr(r.total, true)}. Returns are estimates, not guaranteed.
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Investment">
          <div className="space-y-4 p-4">
            {mode === "sip" ? (
              <TextField label="Monthly investment" suffix="₹" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            ) : (
              <TextField label="One-time investment" suffix="₹" inputMode="decimal" value={lump} onChange={(e) => setLump(e.target.value)} />
            )}
            <TextField label="Expected return" hint="Per year" suffix="%" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
            <TextField label="Period" suffix="years" inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} />
            {mode === "sip" && (
              <TextField
                label="Yearly step-up"
                hint="Optional"
                suffix="%"
                inputMode="decimal"
                placeholder="0"
                value={stepUp}
                onChange={(e) => setStepUp(e.target.value)}
              />
            )}
          </div>
        </PanelSection>
        <PanelSection title="Estimated value">
          <div aria-live="polite">
            {r.ok ? (
              <>
                <Headline label="Total value" value={inr(r.total, true)} />
                <StatGrid
                  stats={[
                    { label: "Invested", value: inr(r.invested, true) },
                    { label: "Estimated returns", value: inr(r.returns, true) },
                  ]}
                />
                <SplitBar invested={r.invested} earned={r.returns} />
              </>
            ) : (
              <p className="p-4 text-sm text-fg-muted">Your estimate appears here.</p>
            )}
          </div>
        </PanelSection>
      </div>
      {r.ok && <GrowthTable years={r.years} />}
    </Panel>
  );
}
