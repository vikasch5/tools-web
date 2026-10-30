import { useState } from "react";
import { TextField } from "~/components/ui/Field";
import { calculateGst, gstRates, inr } from "~/tools/engine/finance";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { StatGrid } from "./results";
import { Headline, num } from "./finance-shared";

const rateLabel = (r: number) => (r === 3 ? "3% gold" : r === 0.25 ? "0.25% diamonds" : `${r}%`);

export function GstCalculator() {
  const [amount, setAmount] = useState("10,000");
  const [rate, setRate] = useState("18");
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [supply, setSupply] = useState<"intra" | "inter">("intra");

  const rateValue = rate === "custom" ? num(custom) : Number(rate);
  const r = calculateGst(num(amount), rateValue, mode, supply === "inter");

  return (
    <Panel
      status={
        r.ok ? (
          <StatusMessage tone="success">
            {mode === "add" ? `${inr(r.base)} + ${rateValue}% GST = ${inr(r.total)}` : `${inr(r.total)} includes ${inr(r.tax)} GST at ${rateValue}%`}.
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Price">
          <div className="space-y-4 p-4">
            <Segmented
              label="Amount is"
              value={mode}
              onChange={(v) => setMode(v as "add" | "remove")}
              choices={[
                { value: "add", label: "Before GST" },
                { value: "remove", label: "Including GST" },
              ]}
            />
            <TextField label="Amount" suffix="₹" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <fieldset className="space-y-2">
              <legend className="text-[0.8125rem] font-medium text-fg-muted">GST rate</legend>
              <div className="flex flex-wrap gap-2">
                {[...gstRates.map(String), "custom"].map((value) => (
                  <label
                    key={value}
                    className="inline-flex h-8 cursor-pointer items-center rounded-md border border-border bg-bg px-3 text-sm font-medium text-fg-muted has-checked:border-fg has-checked:bg-surface has-checked:text-fg has-focus-visible:outline-2 has-focus-visible:outline-ring pointer-coarse:h-11"
                  >
                    <input type="radio" name="gst-rate" value={value} checked={rate === value} onChange={() => setRate(value)} className="sr-only" />
                    {value === "custom" ? "Other" : rateLabel(Number(value))}
                  </label>
                ))}
              </div>
            </fieldset>
            {rate === "custom" && (
              <TextField label="Other rate" suffix="%" inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} />
            )}
            <Segmented
              label="Supply"
              value={supply}
              onChange={(v) => setSupply(v as "intra" | "inter")}
              choices={[
                { value: "intra", label: "Within state" },
                { value: "inter", label: "Other state" },
              ]}
            />
          </div>
        </PanelSection>
        <PanelSection title="Result">
          <div aria-live="polite">
            {r.ok ? (
              <>
                <Headline label={mode === "add" ? "Price with GST" : "Price before GST"} value={inr(mode === "add" ? r.total : r.base)} />
                <StatGrid
                  stats={[
                    { label: "Before GST", value: inr(r.base) },
                    { label: "GST", value: inr(r.tax) },
                    ...(supply === "intra"
                      ? [
                          { label: `CGST (${rateValue / 2}%)`, value: inr(r.cgst) },
                          { label: `SGST (${rateValue / 2}%)`, value: inr(r.sgst) },
                        ]
                      : [
                          { label: `IGST (${rateValue}%)`, value: inr(r.igst) },
                          { label: "Total", value: inr(r.total) },
                        ]),
                  ]}
                />
              </>
            ) : (
              <p className="p-4 text-sm text-fg-muted">The GST breakdown appears here.</p>
            )}
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
