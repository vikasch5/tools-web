import { useEffect, useState } from "react";
import { Check, Copy, Download, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { TextField } from "~/components/ui/Field";
import { generateUuids, inspectUuid, type UuidVersion } from "~/tools/engine/uuid";
import { Segmented, Switch } from "../OptionControls";
import { Panel, PanelSection, StatusMessage, downloadBlob, useCopy } from "../Panel";

export function UuidGenerator() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [count, setCount] = useState("10");
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);
  // Generated after hydration, so server and client HTML match.
  const [list, setList] = useState<string[]>([]);
  const [check, setCheck] = useState("");
  const { copied, copy } = useCopy();

  const n = Math.min(Math.max(Number(count) || 1, 1), 1000);
  const generate = (v = version, opts = { uppercase, hyphens, braces }) =>
    setList(generateUuids(n, v, opts));

  // Run once on mount; later runs come from the controls.
  useEffect(() => {
    generate();
  }, []);

  const update = (next: Partial<{ version: UuidVersion; uppercase: boolean; hyphens: boolean; braces: boolean }>) => {
    const v = next.version ?? version;
    const opts = {
      uppercase: next.uppercase ?? uppercase,
      hyphens: next.hyphens ?? hyphens,
      braces: next.braces ?? braces,
    };
    setVersion(v);
    setUppercase(opts.uppercase);
    setHyphens(opts.hyphens);
    setBraces(opts.braces);
    setList(generateUuids(n, v, opts));
  };

  const text = list.join("\n");
  const info = check.trim() ? inspectUuid(check) : null;

  return (
    <Panel
      toolbar={
        <>
          <Button variant="primary" size="sm" icon={RefreshCw} onClick={() => generate()}>
            Generate
          </Button>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Segmented
              label="Version"
              value={version}
              onChange={(v) => update({ version: v as UuidVersion })}
              choices={[
                { value: "v4", label: "v4 random" },
                { value: "v7", label: "v7 time-ordered" },
              ]}
            />
            <Switch label="Uppercase" checked={uppercase} onChange={(v) => update({ uppercase: v })} />
            <Switch label="Hyphens" checked={hyphens} onChange={(v) => update({ hyphens: v })} />
            <Switch label="Braces" checked={braces} onChange={(v) => update({ braces: v })} />
          </div>
        </>
      }
      status={
        list.length > 0 ? (
          <StatusMessage tone="success">
            Generated {list.length.toLocaleString("en")} {version} {list.length === 1 ? "UUID" : "UUIDs"} with your
            browser’s secure random generator.
            {copied === "all" && <span className="sr-only"> Copied to clipboard.</span>}
          </StatusMessage>
        ) : (
          <StatusMessage tone="idle">Ready.</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <PanelSection
          title={`UUIDs · ${list.length}`}
          actions={
            <>
              <IconButton
                icon={copied === "all" ? Check : Copy}
                label={copied === "all" ? "Copied" : "Copy all"}
                size="sm"
                disabled={!text}
                onClick={() => copy(text, "all")}
              />
              <IconButton
                icon={Download}
                label="Download as .txt"
                size="sm"
                disabled={!text}
                onClick={() => downloadBlob(new Blob([`${text}\n`], { type: "text/plain" }), "uuids.txt")}
              />
            </>
          }
        >
          <div className="flex items-end gap-3 border-b border-border p-3 sm:px-4">
            <TextField
              label="How many"
              hint="1–1,000"
              type="number"
              inputMode="numeric"
              min={1}
              max={1000}
              value={count}
              onChange={(event) => setCount(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && generate()}
              className="w-36"
            />
          </div>
          <ol className="max-h-[min(55vh,26rem)] overflow-auto py-1 font-mono text-[0.8125rem] leading-[1.375rem]">
            {list.map((uuid, i) => (
              <li key={`${i}-${uuid}`} className="group flex items-center gap-3 px-3 hover:bg-surface-2 sm:px-4">
                <span className="w-10 shrink-0 text-right text-fg-subtle select-none">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{uuid}</span>
                <IconButton
                  icon={copied === uuid ? Check : Copy}
                  label={copied === uuid ? "Copied" : `Copy UUID ${i + 1}`}
                  size="sm"
                  onClick={() => copy(uuid, uuid)}
                  className="opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                />
              </li>
            ))}
          </ol>
        </PanelSection>

        <PanelSection title="Check a UUID">
          <div className="space-y-4 p-4">
            <TextField
              label="Paste a UUID"
              value={check}
              onChange={(event) => setCheck(event.target.value)}
              placeholder="e.g. 0192a8c4-…"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={info && !info.valid ? true : undefined}
              aria-describedby="uuid-check-result"
              className="font-mono"
            />
            <div id="uuid-check-result" aria-live="polite">
              {info &&
                (info.valid ? (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                    <dt className="text-fg-subtle">Version</dt>
                    <dd className="text-fg">{info.special ? `${info.special === "nil" ? "Nil" : "Max"} UUID` : info.version}</dd>
                    <dt className="text-fg-subtle">Variant</dt>
                    <dd className="text-fg">{info.variant}</dd>
                    {info.timestamp && (
                      <>
                        <dt className="text-fg-subtle">Created</dt>
                        <dd className="font-mono text-fg">{info.timestamp}</dd>
                      </>
                    )}
                    <dt className="text-fg-subtle">Canonical</dt>
                    <dd className="font-mono break-all text-fg">{info.canonical}</dd>
                  </dl>
                ) : (
                  <StatusMessage tone="error">{info.message}</StatusMessage>
                ))}
            </div>
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
