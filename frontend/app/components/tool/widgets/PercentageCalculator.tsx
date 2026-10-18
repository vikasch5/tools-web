import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { TextField } from "~/components/ui/Field";
import { calculatePercent, parseNumber, type PercentMode } from "~/tools/engine/percent";
import { Panel, StatusMessage, useCopy } from "../Panel";

type Calculator = {
  mode: PercentMode;
  title: string;
  a: { label: string; suffix?: string; initial: string };
  b: { label: string; suffix?: string; initial: string };
  /** Sentence shown with the answer. */
  sentence: (a: string, b: string, result: string) => string;
};

const calculators: Calculator[] = [
  {
    mode: "of",
    title: "What is X% of Y?",
    a: { label: "Percentage", suffix: "%", initial: "15" },
    b: { label: "Of", initial: "80" },
    sentence: (a, b, r) => `${a}% of ${b} is ${r}`,
  },
  {
    mode: "is-what",
    title: "X is what percent of Y?",
    a: { label: "Value", initial: "30" },
    b: { label: "Total", initial: "120" },
    sentence: (a, b, r) => `${a} is ${r} of ${b}`,
  },
  {
    mode: "change",
    title: "Percentage change from X to Y",
    a: { label: "From", initial: "50" },
    b: { label: "To", initial: "65" },
    sentence: (a, b, r) => `Going from ${a} to ${b} is a change of ${r}`,
  },
  {
    mode: "adjust",
    title: "Increase or decrease Y by X%",
    a: { label: "Change (use − to decrease)", suffix: "%", initial: "-20" },
    b: { label: "Value", initial: "250" },
    sentence: (a, b, r) => `${b} ${a.startsWith("-") ? "decreased" : "increased"} by ${a.replace(/^-/, "")}% is ${r}`,
  },
];

function CalculatorCard({ calc }: { calc: Calculator }) {
  const [a, setA] = useState(calc.a.initial);
  const [b, setB] = useState(calc.b.initial);
  const { copied, copy } = useCopy();
  const result = calculatePercent(calc.mode, parseNumber(a), parseNumber(b));
  const id = `pct-${calc.mode}`;

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-4 bg-surface p-4 sm:p-5">
      <h2 id={`${id}-title`} className="font-display text-lg font-semibold tracking-tight text-fg">
        {calc.title}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={calc.a.label}
          suffix={calc.a.suffix}
          inputMode="decimal"
          value={a}
          onChange={(event) => setA(event.target.value)}
          aria-invalid={a.trim() !== "" && Number.isNaN(parseNumber(a)) ? true : undefined}
        />
        <TextField
          label={calc.b.label}
          suffix={calc.b.suffix}
          inputMode="decimal"
          value={b}
          onChange={(event) => setB(event.target.value)}
          aria-invalid={b.trim() !== "" && Number.isNaN(parseNumber(b)) ? true : undefined}
        />
      </div>
      <div aria-live="polite" className="mt-auto rounded-lg bg-bg p-3 ring-1 ring-border">
        {result.ok ? (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl font-semibold tracking-tight text-fg tabular-nums">{result.text}</p>
              <p className="mt-0.5 text-sm text-fg-muted">{calc.sentence(a.trim(), b.trim(), result.text)}</p>
              <p className="mt-1 font-mono text-xs break-words text-fg-subtle">{result.detail}</p>
            </div>
            <IconButton
              icon={copied ? Check : Copy}
              label={copied ? "Copied" : "Copy result"}
              size="sm"
              onClick={() => copy(result.text.replace(/,/g, ""))}
            />
          </div>
        ) : (
          <StatusMessage tone={a.trim() && b.trim() ? "error" : "idle"}>{result.message}</StatusMessage>
        )}
      </div>
    </section>
  );
}

export function PercentageCalculator() {
  return (
    <Panel>
      <div className="grid gap-px bg-border md:grid-cols-2">
        {calculators.map((calc) => (
          <CalculatorCard key={calc.mode} calc={calc} />
        ))}
      </div>
    </Panel>
  );
}
