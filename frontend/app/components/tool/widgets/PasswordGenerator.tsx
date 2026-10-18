import { useEffect, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { RangeField } from "~/components/ui/Field";
import { cn } from "~/lib/cn";
import {
  crackTime,
  generatePassword,
  passwordEntropy,
  strengthLabel,
  type PasswordOptions,
} from "~/tools/engine/password";
import { Segmented, Switch } from "../OptionControls";
import { Panel, PanelSection, StatusMessage, useCopy } from "../Panel";

const meterTone: Record<string, string> = {
  Weak: "bg-danger",
  Fair: "bg-warning",
  Strong: "bg-success",
  "Very strong": "bg-success",
};

export function PasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 20,
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
    avoidAmbiguous: false,
  });
  const [count, setCount] = useState("5");
  // Generated after hydration, so server and client HTML match.
  const [list, setList] = useState<string[]>([]);
  const [error, setError] = useState("");
  const { copied, copy } = useCopy();

  const generate = (opts = options, n = Number(count)) => {
    try {
      setList(Array.from({ length: n }, () => generatePassword(opts)));
      setError("");
    } catch (e) {
      setList([]);
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    generate();
  }, []);

  const update = (next: Partial<PasswordOptions>) => {
    const opts = { ...options, ...next };
    setOptions(opts);
    generate(opts);
  };

  const bits = passwordEntropy(options);
  const label = strengthLabel(bits);

  return (
    <Panel
      toolbar={
        <>
          <Button variant="primary" size="sm" icon={RefreshCw} onClick={() => generate()}>
            Generate
          </Button>
          <Segmented
            label="How many"
            value={count}
            onChange={(v) => {
              setCount(v);
              generate(options, Number(v));
            }}
            choices={["1", "5", "10", "20"].map((v) => ({ value: v, label: v }))}
          />
        </>
      }
      status={
        error ? (
          <StatusMessage tone="error">{error}</StatusMessage>
        ) : (
          <StatusMessage tone="idle">
            Made on your device with your browser’s secure random generator. Nothing is sent or stored.
            {copied && <span className="sr-only"> Copied to clipboard.</span>}
          </StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,1fr)]">
        <PanelSection title={list.length === 1 ? "Password" : `Passwords · ${list.length}`}>
          <ol className="bg-surface py-1">
            {list.map((p, i) => (
              <li key={`${i}-${p}`} className="group flex items-center gap-3 px-3 py-1 hover:bg-surface-2 sm:px-4">
                <span className="min-w-0 flex-1 font-mono text-[0.9375rem] break-all text-fg">{p}</span>
                <IconButton
                  icon={copied === p ? Check : Copy}
                  label={copied === p ? "Copied" : `Copy password ${i + 1}`}
                  size="sm"
                  onClick={() => copy(p, p)}
                />
              </li>
            ))}
          </ol>
        </PanelSection>
        <PanelSection title="Settings">
          <div className="space-y-4 bg-surface p-4">
            <RangeField
              label="Length"
              valueText={`${options.length} characters`}
              min={4}
              max={128}
              value={options.length}
              onChange={(event) => update({ length: Number(event.target.value) })}
            />
            <div className="grid grid-cols-2 gap-x-4">
              <Switch label="A–Z" checked={options.upper} onChange={(v) => update({ upper: v })} />
              <Switch label="a–z" checked={options.lower} onChange={(v) => update({ lower: v })} />
              <Switch label="0–9" checked={options.digits} onChange={(v) => update({ digits: v })} />
              <Switch label="Symbols !@#" checked={options.symbols} onChange={(v) => update({ symbols: v })} />
            </div>
            <Switch
              label="Avoid look-alikes (I l 1 O 0 o)"
              checked={options.avoidAmbiguous}
              onChange={(v) => update({ avoidAmbiguous: v })}
            />
            {bits > 0 && (
              <div className="space-y-1.5 border-t border-border pt-4">
                <p className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-fg">{label}</span>
                  <span className="font-mono text-xs text-fg-subtle">{bits} bits</span>
                </p>
                <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className={cn("h-full rounded-full", meterTone[label])} style={{ width: `${Math.min(100, (bits / 128) * 100)}%` }} />
                </div>
                <p className="text-xs text-fg-muted">
                  Guessing it offline would take {crackTime(bits)} at 10 billion guesses a second.
                </p>
              </div>
            )}
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
