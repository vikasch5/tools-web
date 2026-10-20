import { useDeferredValue, useEffect, useState } from "react";
import { Eraser, FileText, Sparkles } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { TextField } from "~/components/ui/Field";
import { hashAlgorithms, hashAll, matchChecksum, utf8, type HashAlgorithm } from "~/tools/engine/hash";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { Segmented, Switch } from "../OptionControls";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { formatBytes } from "../format";
import { CopyList } from "./results";

type Hashes = Record<HashAlgorithm, string>;
const MAX_FILE_BYTES = 200 * 1024 * 1024;

export function HashGenerator() {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const deferred = useDeferredValue(text);
  const [file, setFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<Hashes | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [uppercase, setUppercase] = useState(false);
  const [expected, setExpected] = useState("");

  useEffect(() => warmUpWorker(), []);

  // Text is hashed on the main thread: it is small and updates as you type.
  useEffect(() => {
    if (mode !== "text") return;
    let current = true;
    if (!deferred) setHashes(null);
    else hashAll(utf8(deferred)).then((h) => current && setHashes(h));
    return () => {
      current = false;
    };
  }, [deferred, mode]);

  const hashFile = async (next: File) => {
    setFile(next);
    setHashes(null);
    setError("");
    setWorking(true);
    const r = await runTaskInWorker({ type: "hash", data: new Uint8Array(await next.arrayBuffer()) });
    setWorking(false);
    if (r.ok) setHashes(r.value);
    else setError(r.message);
  };

  const switchMode = (next: "text" | "file") => {
    setMode(next);
    setHashes(null);
    setError("");
    if (next === "file" && file) hashFile(file);
  };

  const match = hashes ? matchChecksum(expected, hashes) : null;
  const shown = (h: string) => (uppercase ? h.toUpperCase() : h);

  return (
    <Panel
      toolbar={
        <>
          <Segmented
            label="Hash"
            value={mode}
            onChange={(v) => switchMode(v as "text" | "file")}
            choices={[
              { value: "text", label: "Text" },
              { value: "file", label: "File" },
            ]}
          />
          <Switch label="Uppercase" checked={uppercase} onChange={setUppercase} />
        </>
      }
      status={
        working ? (
          <StatusMessage tone="working">Hashing {file?.name}…</StatusMessage>
        ) : error ? (
          <StatusMessage tone="error">{error}</StatusMessage>
        ) : match ? (
          <StatusMessage tone="success">Match: the expected checksum is the {match} hash.</StatusMessage>
        ) : match === false ? (
          <StatusMessage tone="error">No match: the expected checksum differs from every hash below.</StatusMessage>
        ) : hashes ? (
          <StatusMessage tone="success">
            {mode === "file" && file ? `Hashed ${file.name} (${formatBytes(file.size)}).` : "Hashes update as you type. Text is encoded as UTF-8."}
          </StatusMessage>
        ) : (
          <StatusMessage tone="idle">{mode === "text" ? "Type or paste text to hash it." : "Choose a file to hash it."}</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <PanelSection
          title={mode === "text" ? "Your text" : "Your file"}
          actions={
            mode === "text" && (
              <>
                <IconButton icon={Sparkles} label="Load sample" size="sm" onClick={() => setText("The quick brown fox jumps over the lazy dog")} />
                <IconButton icon={Eraser} label="Clear" size="sm" disabled={!text} onClick={() => setText("")} />
              </>
            )
          }
        >
          {mode === "text" ? (
            <>
              <label htmlFor="hash-input" className="sr-only">
                Text to hash
              </label>
              <textarea
                id="hash-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste text…"
                spellCheck={false}
                className="block min-h-64 w-full resize-y bg-surface p-4 font-mono text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus-visible:outline-none"
              />
            </>
          ) : (
            <div className="space-y-3 p-4">
              <FileDrop
                accept={[]}
                maxBytes={MAX_FILE_BYTES}
                compact={file !== null}
                title={file ? "Choose another file" : "Drop any file here"}
                hint="Up to 200 MB. The file is read on your device, not uploaded."
                onFiles={(files) => hashFile(files[0])}
                onReject={setError}
              />
              {file && (
                <p className="flex items-center gap-2 text-sm text-fg-muted">
                  <FileText aria-hidden size={16} strokeWidth={1.75} />
                  <span className="min-w-0 truncate">{file.name}</span>
                  <span className="shrink-0 font-mono text-xs">{formatBytes(file.size)}</span>
                </p>
              )}
            </div>
          )}
          <div className="border-t border-border p-4">
            <TextField
              label="Compare with a checksum"
              hint="Optional"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              placeholder="Paste the expected hash"
              spellCheck={false}
              autoComplete="off"
              className="[&_input]:font-mono"
            />
          </div>
        </PanelSection>
        <PanelSection title="Hashes">
          <div aria-live="polite">
            <CopyList items={hashAlgorithms.map((a) => ({ label: a, value: hashes ? shown(hashes[a]) : "" }))} />
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
