import { useRef, useState } from "react";
import { TextField } from "~/components/ui/Field";
import { contrastLevel, contrastRatio, formatColor, parseAnyColor, toHex, type Rgb } from "~/tools/engine/color";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { CopyList } from "./results";

const WHITE: Rgb = { r: 255, g: 255, b: 255, alpha: 1 };
const BLACK: Rgb = { r: 0, g: 0, b: 0, alpha: 1 };

function ContrastRow({ label, color, against }: { label: string; color: Rgb; against: Rgb }) {
  const ratio = contrastRatio(color, against);
  const level = contrastLevel(ratio);
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      {/* Inline colours are user data, not design tokens. */}
      <span
        aria-hidden
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold ring-1 ring-border"
        style={{ background: toHex(against), color: toHex({ ...color, alpha: 1 }) }}
      >
        Aa
      </span>
      <span className="min-w-0 flex-1 text-sm text-fg">{label}</span>
      <span className="font-mono text-sm text-fg tabular-nums">{ratio}:1</span>
      <span className="w-32 text-right text-xs font-medium text-fg-muted">{level}</span>
    </li>
  );
}

export function ColorConverter() {
  const [input, setInput] = useState("#f4511e");
  const parsed = parseAnyColor(input);
  // Keep showing the last valid colour while the text is being edited.
  const last = useRef<Rgb>({ r: 244, g: 81, b: 30, alpha: 1 });
  if (parsed) last.current = parsed;
  const color = parsed ?? last.current;
  const f = formatColor(color);

  return (
    <Panel
      status={
        parsed ? (
          <StatusMessage tone="success">Read as {f.hex}. Every format updates as you type or pick.</StatusMessage>
        ) : (
          <StatusMessage tone="error">Not a colour this tool can read. Try #1e90ff, rgb(30 144 255) or hsl(210 100% 56%).</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.4fr)]">
        <PanelSection title="Colour">
          <div className="space-y-4 p-4">
            <div
              aria-hidden
              className="h-36 rounded-lg ring-1 ring-border"
              style={{ background: f.rgb }}
            />
            <div className="flex items-end gap-3">
              <label className="flex flex-col gap-1.5 text-[0.8125rem] font-medium text-fg-muted">
                Pick
                <input
                  type="color"
                  value={toHex({ ...color, alpha: 1 })}
                  onChange={(e) => setInput(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-border bg-bg p-1 pointer-coarse:h-11"
                />
              </label>
              <TextField
                label="Or type any format"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                className="flex-1 [&_input]:font-mono"
                aria-invalid={parsed ? undefined : true}
              />
            </div>
          </div>
        </PanelSection>
        <PanelSection title="Formats">
          <div aria-live="polite">
            <CopyList
              items={[
                { label: "HEX", value: f.hex },
                { label: "RGB", value: f.rgb },
                { label: "HSL", value: f.hsl },
                { label: "HSV", value: f.hsv },
                { label: "CMYK", value: f.cmyk },
              ]}
            />
            <h3 className="label-mono border-t border-border px-4 pt-3 font-sans text-fg-subtle">Text contrast (WCAG 2)</h3>
            <ul className="divide-y divide-border">
              <ContrastRow label="On a white background" color={color} against={WHITE} />
              <ContrastRow label="On a black background" color={color} against={BLACK} />
            </ul>
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
