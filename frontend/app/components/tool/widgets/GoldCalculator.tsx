import { useState } from "react";
import { TextField } from "~/components/ui/Field";
import { GOLD_GST, calculateGold, purities, type GoldInput } from "~/tools/engine/everyday";
import { inr } from "~/tools/engine/finance";
import { Segmented, Switch } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { StatGrid } from "./results";
import { Headline, num } from "./finance-shared";

export function GoldCalculator() {
  const [rate, setRate] = useState("");
  const [per, setPer] = useState<"1" | "10">("10");
  const [karat, setKarat] = useState<GoldInput["karat"]>(22);
  const [grams, setGrams] = useState("10");
  const [making, setMaking] = useState("12");
  const [makingType, setMakingType] = useState<GoldInput["makingType"]>("percent");
  const [gst, setGst] = useState(true);

  const r = calculateGold({ rate24k: num(rate) / Number(per), karat, grams: num(grams), making: num(making), makingType, includeGst: gst });

  return (
    <Panel
      status={
        !rate.trim() ? (
          <StatusMessage tone="idle">Enter today's 24K rate from your jeweller or a news site; this page does not fetch live prices.</StatusMessage>
        ) : r.ok ? (
          <StatusMessage tone="success">
            {grams} g of {karat}K at {inr(r.ratePerGram)} a gram costs {inr(r.total)} in all.
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Gold">
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <TextField label="Today's 24K (999) rate" suffix="₹" inputMode="decimal" placeholder="e.g. 1,25,000" value={rate} onChange={(e) => setRate(e.target.value)} />
              <Segmented
                label="Per"
                value={per}
                onChange={(v) => setPer(v as "1" | "10")}
                choices={[
                  { value: "10", label: "10 grams" },
                  { value: "1", label: "1 gram" },
                ]}
              />
            </div>
            <Segmented
              label="Purity"
              value={String(karat)}
              onChange={(v) => setKarat(Number(v) as GoldInput["karat"])}
              choices={purities.map((p) => ({ value: String(p.karat), label: `${p.karat}K` }))}
            />
            <TextField label="Weight" suffix="g" inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)} />
            <div className="space-y-2">
              <TextField label="Making charges" suffix={makingType === "percent" ? "%" : "₹/g"} inputMode="decimal" value={making} onChange={(e) => setMaking(e.target.value)} />
              <Segmented
                label="As"
                value={makingType}
                onChange={(v) => setMakingType(v as GoldInput["makingType"])}
                choices={[
                  { value: "percent", label: "% of gold value" },
                  { value: "perGram", label: "₹ per gram" },
                ]}
              />
            </div>
            <Switch label={`Add ${GOLD_GST}% GST`} checked={gst} onChange={setGst} />
          </div>
        </PanelSection>
        <PanelSection title="Price">
          <div aria-live="polite">
            {rate.trim() && r.ok ? (
              <>
                <Headline label="Total price" value={inr(r.total)}>
                  {karat}K rate: {inr(r.ratePerGram)} a gram ({purities.find((p) => p.karat === karat)!.fineness} fineness).
                </Headline>
                <StatGrid
                  stats={[
                    { label: "Gold value", value: inr(r.goldValue) },
                    { label: "Making charges", value: inr(r.makingCharges) },
                    { label: `GST (${GOLD_GST}%)`, value: inr(r.gst) },
                    { label: "Total", value: inr(r.total) },
                  ]}
                />
                <p className="border-t border-border px-4 py-3 text-xs text-fg-muted">
                  Hallmarked jewellery carries a BIS HUID code. Stone weight should be deducted before the gold value is worked out.
                </p>
              </>
            ) : (
              <p className="p-4 text-sm text-fg-muted">Enter today's rate to see the price.</p>
            )}
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
