import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { TextField } from "~/components/ui/Field";
import { convertTimestamp, type TimestampUnit } from "~/tools/engine/timestamp";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { CopyList } from "./results";

const units: { value: TimestampUnit | "auto"; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "seconds", label: "s" },
  { value: "milliseconds", label: "ms" },
  { value: "microseconds", label: "µs" },
];

export function TimestampConverter() {
  // The clock starts after hydration, so server and client HTML match.
  const [now, setNow] = useState<number | null>(null);
  const [input, setInput] = useState("1700000000");
  const [unit, setUnit] = useState<TimestampUnit | "auto">("auto");

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const zone = now ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
  const r = now ? convertTimestamp(input, { unit, now }) : null;

  return (
    <Panel
      toolbar={
        <>
          <Button size="sm" variant="primary" icon={Clock} onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}>
            Use current time
          </Button>
          <p className="font-mono text-sm text-fg-muted tabular-nums">
            Now: {now ? Math.floor(now / 1000) : "—"}
          </p>
        </>
      }
      status={
        !r ? (
          <StatusMessage tone="idle">Loading your time zone…</StatusMessage>
        ) : r.ok ? (
          <StatusMessage tone="success">
            Read as {r.readAs.toLowerCase()}. Local time is shown for {zone}.
          </StatusMessage>
        ) : (
          <StatusMessage tone="error">{r.message}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.6fr)]">
        <PanelSection title="Timestamp or date">
          <div className="space-y-4 p-4">
            <TextField
              label="Unix timestamp or date"
              hint="e.g. 1700000000 or 2026-10-18 14:30"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              className="[&_input]:font-mono"
              aria-invalid={r && !r.ok ? true : undefined}
            />
            <Segmented label="Number unit" value={unit} onChange={(v) => setUnit(v as TimestampUnit | "auto")} choices={units} />
            <p className="text-xs leading-relaxed text-fg-subtle">
              Dates without a time zone, such as 2026-10-18 14:30, are read in your own time zone. Add Z or +05:30 to set one.
            </p>
          </div>
        </PanelSection>
        <PanelSection title="Converted">
          <div aria-live="polite">
            {r?.ok ? (
              <CopyList
                items={[
                  { label: "Unix seconds", value: String(r.seconds) },
                  { label: "Unix milliseconds", value: String(r.ms) },
                  { label: "ISO 8601 (UTC)", value: r.iso },
                  { label: "UTC", value: r.utc },
                  { label: `Your time (${zone})`, value: r.local },
                  { label: "Relative", value: r.relative },
                ]}
              />
            ) : (
              <p className="p-4 text-sm text-fg-muted">Every format appears here.</p>
            )}
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
