import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { SelectField, TextField } from "~/components/ui/Field";
import { convertUnit, feetAndInches, formatQuantity, unitGroups } from "~/tools/engine/everyday";
import { parseNumber } from "~/tools/engine/percent";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { Headline } from "./finance-shared";

const defaults: Record<string, [string, string]> = {
  length: ["ft", "cm"],
  weight: ["kg", "lb"],
  area: ["sqft", "m2"],
  volume: ["l", "gal"],
  speed: ["kmh", "mph"],
  data: ["GB", "MB"],
  temperature: ["C", "F"],
};

export function UnitConverter() {
  const [group, setGroup] = useState("length");
  const [from, setFrom] = useState("ft");
  const [to, setTo] = useState("cm");
  const [value, setValue] = useState("5.8");

  const g = unitGroups.find((x) => x.id === group)!;
  const v = parseNumber(value);
  const result = convertUnit(v, group, from, to);
  const name = (id: string) => g.units.find((u) => u.id === id)!.label;

  return (
    <Panel
      status={
        Number.isFinite(v) ? (
          <StatusMessage tone="success">
            {formatQuantity(v)} {name(from)} = {formatQuantity(result)} {name(to)}
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">Enter a number.</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Convert">
          <div className="space-y-4 p-4">
            <fieldset className="space-y-2">
              <legend className="text-[0.8125rem] font-medium text-fg-muted">Quantity</legend>
              <div className="flex flex-wrap gap-2">
                {unitGroups.map((x) => (
                  <label
                    key={x.id}
                    className="inline-flex h-8 cursor-pointer items-center rounded-md border border-border bg-bg px-3 text-sm font-medium text-fg-muted has-checked:border-fg has-checked:bg-surface has-checked:text-fg has-focus-visible:outline-2 has-focus-visible:outline-ring pointer-coarse:h-11"
                  >
                    <input
                      type="radio"
                      name="unit-group"
                      value={x.id}
                      checked={group === x.id}
                      onChange={() => {
                        setGroup(x.id);
                        setFrom(defaults[x.id][0]);
                        setTo(defaults[x.id][1]);
                      }}
                      className="sr-only"
                    />
                    {x.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <TextField label="Value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <SelectField label="From" value={from} onChange={(e) => setFrom(e.target.value)}>
                {g.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </SelectField>
              <IconButton
                icon={ArrowLeftRight}
                label="Swap units"
                onClick={() => {
                  setFrom(to);
                  setTo(from);
                }}
              />
              <SelectField label="To" value={to} onChange={(e) => setTo(e.target.value)}>
                {g.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
        </PanelSection>
        <PanelSection title="Result">
          <div aria-live="polite">
            {Number.isFinite(v) ? (
              <>
                <Headline label={name(to)} value={formatQuantity(result)}>
                  {group === "length" && to !== "ft" && to !== "in" ? `That is ${feetAndInches(convertUnit(v, group, from, "m"))}.` : null}
                </Headline>
                <ul className="divide-y divide-border">
                  {g.units
                    .filter((u) => u.id !== from)
                    .map((u) => (
                      <li key={u.id} className="flex items-baseline justify-between gap-4 px-4 py-2 text-sm">
                        <span className="text-fg-muted">{u.label}</span>
                        <span className="font-mono text-fg tabular-nums">{formatQuantity(convertUnit(v, group, from, u.id))}</span>
                      </li>
                    ))}
                </ul>
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
