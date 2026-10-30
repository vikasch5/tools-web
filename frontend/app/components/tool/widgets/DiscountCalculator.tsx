import { useState } from "react";
import { TextField } from "~/components/ui/Field";
import { applyDiscounts, discountPercent } from "~/tools/engine/everyday";
import { inr } from "~/tools/engine/finance";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { StatGrid } from "./results";
import { Headline, num } from "./finance-shared";

export function DiscountCalculator() {
  const [mode, setMode] = useState<"price" | "percent">("price");
  const [price, setPrice] = useState("2,499");
  const [first, setFirst] = useState("20");
  const [second, setSecond] = useState("");
  const [paid, setPaid] = useState("1,749");

  const percents = [num(first), ...(second.trim() ? [num(second)] : [])];
  const r = applyDiscounts(num(price), percents);
  const pct = discountPercent(num(price), num(paid));

  return (
    <Panel
      toolbar={
        <Segmented
          label="Find"
          value={mode}
          onChange={(v) => setMode(v as "price" | "percent")}
          choices={[
            { value: "price", label: "Price after discount" },
            { value: "percent", label: "Discount %" },
          ]}
        />
      }
      status={
        mode === "price" ? (
          r.ok ? (
            <StatusMessage tone="success">
              {inr(num(price))} − {percents.join("% − ")}% = {inr(r.final)}.
            </StatusMessage>
          ) : (
            <StatusMessage tone="error">{r.message}</StatusMessage>
          )
        ) : pct !== null ? (
          <StatusMessage tone={pct >= 0 ? "success" : "warning"}>
            {pct >= 0 ? `${pct}% off the marked price.` : `That is ${-pct}% more than the marked price.`}
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">Enter the marked price and what you pay.</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Price">
          <div className="space-y-4 p-4">
            <TextField label="Marked price (MRP)" suffix="₹" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            {mode === "price" ? (
              <>
                <TextField label="Discount" suffix="%" inputMode="decimal" value={first} onChange={(e) => setFirst(e.target.value)} />
                <TextField label="Extra discount" hint="Optional, e.g. a bank offer" suffix="%" inputMode="decimal" placeholder="0" value={second} onChange={(e) => setSecond(e.target.value)} />
              </>
            ) : (
              <TextField label="Price you pay" suffix="₹" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} />
            )}
          </div>
        </PanelSection>
        <PanelSection title="Result">
          <div aria-live="polite">
            {mode === "price" && r.ok ? (
              <>
                <Headline label="You pay" value={inr(r.final)} />
                <StatGrid
                  stats={[
                    { label: "You save", value: inr(r.saved) },
                    { label: "Total discount", value: `${r.effectivePercent}%` },
                  ]}
                />
                {percents.length > 1 && (
                  <p className="border-t border-border px-4 py-3 text-sm text-fg-muted">
                    {percents[0]}% + {percents[1]}% is {r.effectivePercent}% in total, not {percents[0] + percents[1]}%: the second discount applies to the already reduced price.
                  </p>
                )}
              </>
            ) : mode === "percent" && pct !== null ? (
              <>
                <Headline label="Discount" value={`${Math.max(pct, 0)}%`} />
                <StatGrid
                  stats={[
                    { label: "You save", value: inr(Math.max(0, num(price) - num(paid))) },
                    { label: "You pay", value: inr(num(paid)) },
                  ]}
                />
              </>
            ) : (
              <p className="p-4 text-sm text-fg-muted">The result appears here.</p>
            )}
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
