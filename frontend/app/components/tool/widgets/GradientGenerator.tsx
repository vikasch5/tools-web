import { useState } from "react";
import { ArrowLeftRight, Check, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { RangeField, TextField } from "~/components/ui/Field";
import {
  gradientCss,
  gradientDeclaration,
  gradientPresets,
  parseColor,
  parseGradient,
  type Gradient,
  type GradientStop,
} from "~/tools/engine/gradient";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage, useCopy } from "../Panel";

/** Mixes the two neighbouring stops for a new stop placed between them. */
function midStop(stops: GradientStop[]): GradientStop {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  let gap = 0;
  let at = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const size = sorted[i + 1].position - sorted[i].position;
    if (size > gap) {
      gap = size;
      at = i;
    }
  }
  const [a, b] = [sorted[at], sorted[at + 1] ?? sorted[at]];
  const mix = (i: number) =>
    Math.round((parseInt(a.color.slice(i, i + 2), 16) + parseInt(b.color.slice(i, i + 2), 16)) / 2)
      .toString(16)
      .padStart(2, "0");
  return {
    color: `#${mix(1)}${mix(3)}${mix(5)}`,
    opacity: Math.round((a.opacity + b.opacity) / 2),
    position: Math.round((a.position + b.position) / 2),
  };
}

function StopEditor({
  stop,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  stop: GradientStop;
  index: number;
  canRemove: boolean;
  onChange: (stop: GradientStop) => void;
  onRemove: () => void;
}) {
  const [hex, setHex] = useState(stop.color);
  const [lastColor, setLastColor] = useState(stop.color);
  if (stop.color !== lastColor) {
    setLastColor(stop.color);
    setHex(stop.color);
  }
  const n = index + 1;
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <label className="relative mb-0.5 inline-flex size-10 cursor-pointer overflow-hidden rounded-md ring-1 ring-border-strong/50 has-focus-visible:outline-2 has-focus-visible:outline-ring">
        <span className="sr-only">Stop {n} colour picker</span>
        <input
          type="color"
          value={stop.color}
          onChange={(event) => onChange({ ...stop, color: event.target.value })}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
        <span aria-hidden className="size-full" style={{ backgroundColor: stop.color, opacity: stop.opacity / 100 }} />
      </label>
      <div className="grid min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] gap-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,1fr)]">
        <TextField
          label={`Stop ${n}`}
          value={hex}
          spellCheck={false}
          className="font-mono"
          aria-invalid={parseColor(hex) ? undefined : true}
          onChange={(event) => {
            setHex(event.target.value);
            const parsed = parseColor(event.target.value);
            if (parsed && /^#[0-9a-f]{6}$/i.test(event.target.value.trim()))
              onChange({ ...stop, color: parsed.color });
          }}
          onBlur={() => {
            const parsed = parseColor(hex);
            if (parsed) onChange({ ...stop, ...parsed });
            else setHex(stop.color);
          }}
        />
        <RangeField
          label="Position"
          valueText={`${stop.position}%`}
          min={0}
          max={100}
          value={stop.position}
          onChange={(event) => onChange({ ...stop, position: Number(event.target.value) })}
        />
        <RangeField
          label="Opacity"
          valueText={`${stop.opacity}%`}
          min={0}
          max={100}
          value={stop.opacity}
          onChange={(event) => onChange({ ...stop, opacity: Number(event.target.value) })}
          className="col-span-2 sm:col-span-1"
        />
      </div>
      <IconButton icon={Trash2} label={`Remove stop ${n}`} size="sm" disabled={!canRemove} onClick={onRemove} />
    </li>
  );
}

export function GradientGenerator() {
  const [gradient, setGradient] = useState<Gradient>(gradientPresets[0].gradient);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const { copied, copy } = useCopy();
  const css = gradientCss(gradient);
  const declaration = gradientDeclaration(gradient);

  const setStops = (stops: GradientStop[]) => setGradient({ ...gradient, stops });

  return (
    <Panel
      toolbar={
        <>
          <Segmented
            label="Type"
            value={gradient.type}
            onChange={(type) => setGradient({ ...gradient, type: type as Gradient["type"] })}
            choices={[
              { value: "linear", label: "Linear" },
              { value: "radial", label: "Radial" },
              { value: "conic", label: "Conic" },
            ]}
          />
          {gradient.type === "radial" ? (
            <Segmented
              label="Shape"
              value={gradient.shape}
              onChange={(shape) => setGradient({ ...gradient, shape: shape as Gradient["shape"] })}
              choices={[
                { value: "ellipse", label: "Ellipse" },
                { value: "circle", label: "Circle" },
              ]}
            />
          ) : (
            <RangeField
              label={gradient.type === "conic" ? "Start angle" : "Angle"}
              valueText={`${gradient.angle}°`}
              min={0}
              max={360}
              value={gradient.angle}
              onChange={(event) => setGradient({ ...gradient, angle: Number(event.target.value) })}
              className="w-48"
            />
          )}
          <div className="ml-auto flex items-center gap-0.5">
            <IconButton
              icon={ArrowLeftRight}
              label="Reverse colours"
              size="sm"
              onClick={() => setStops(gradient.stops.map((s) => ({ ...s, position: 100 - s.position })))}
            />
          </div>
        </>
      }
      status={
        <StatusMessage tone="success">
          {gradient.stops.length} colour stops · {gradient.type} gradient
          {copied && <span className="sr-only"> CSS copied to clipboard.</span>}
        </StatusMessage>
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <PanelSection title="Preview">
          <div className="p-4">
            <div
              role="img"
              aria-label={`Preview of ${css}`}
              className="h-56 rounded-lg ring-1 ring-border sm:h-72 lg:h-80"
              style={{ backgroundImage: css }}
            />
            <div className="mt-4">
              <p className="label-mono text-fg-subtle">Presets</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {gradientPresets.map((preset) => (
                  <li key={preset.name}>
                    <button
                      type="button"
                      onClick={() => setGradient(preset.gradient)}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface pr-3 pl-1 text-sm text-fg-muted shadow-sm transition-colors hover:border-border-strong hover:text-fg pointer-coarse:h-11"
                    >
                      <span aria-hidden className="size-7 rounded-sm" style={{ backgroundImage: gradientCss(preset.gradient) }} />
                      {preset.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </PanelSection>

        <PanelSection
          title="Colour stops"
          actions={
            <Button
              size="sm"
              variant="ghost"
              icon={Plus}
              disabled={gradient.stops.length >= 8}
              onClick={() => setStops([...gradient.stops, midStop(gradient.stops)])}
            >
              Add stop
            </Button>
          }
        >
          <ol>
            {gradient.stops.map((stop, i) => (
              <StopEditor
                key={i}
                stop={stop}
                index={i}
                canRemove={gradient.stops.length > 2}
                onChange={(next) => setStops(gradient.stops.map((s, j) => (j === i ? next : s)))}
                onRemove={() => setStops(gradient.stops.filter((_, j) => j !== i))}
              />
            ))}
          </ol>
        </PanelSection>
      </div>

      <div className="grid gap-px border-t border-border bg-border md:grid-cols-2">
        <PanelSection
          title="CSS"
          actions={
            <IconButton
              icon={copied ? Check : Copy}
              label={copied ? "Copied" : "Copy CSS"}
              size="sm"
              onClick={() => copy(declaration)}
            />
          }
        >
          <pre className="overflow-x-auto p-4 font-mono text-[0.8125rem] leading-6 whitespace-pre-wrap break-all text-fg">
            <code>{declaration}</code>
          </pre>
        </PanelSection>
        <PanelSection title="Edit an existing gradient">
          <form
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = parseGradient(importText);
              if ("error" in parsed) setImportError(parsed.error);
              else {
                setGradient(parsed);
                setImportError("");
              }
            }}
          >
            <TextField
              label="Paste CSS"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="linear-gradient(90deg, #ff7a1a, #ec3a76)"
              spellCheck={false}
              className="flex-1 font-mono"
              aria-invalid={importError ? true : undefined}
              aria-describedby="gradient-import-error"
            />
            <Button type="submit" disabled={!importText.trim()}>
              Load
            </Button>
          </form>
          <p id="gradient-import-error" className="px-4 pb-4 text-sm empty:hidden">
            {importError && <StatusMessage tone="error">{importError}</StatusMessage>}
          </p>
        </PanelSection>
      </div>
    </Panel>
  );
}
