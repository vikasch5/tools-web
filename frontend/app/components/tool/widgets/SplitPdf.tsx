import { useEffect, useState } from "react";
import { FileText, LoaderCircle, X } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { TextField } from "~/components/ui/Field";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { parsePageRanges } from "~/tools/engine/page-ranges";
import type { PdfFile, SplitMode } from "~/tools/engine/pdf";
import { Segmented } from "../OptionControls";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { MAX_PDF_BYTES, PDF_ACCEPT, pdfBlob, toPdfFile } from "./pdf-shared";

const modes: { value: SplitMode; label: string; help: string }[] = [
  { value: "extract", label: "Extract pages", help: "The pages you list are saved together as one new PDF." },
  { value: "ranges", label: "Split by range", help: "Each range becomes its own PDF, downloaded together as a ZIP." },
  { value: "every", label: "Every page", help: "Each page becomes its own PDF, downloaded together as a ZIP." },
];

export function SplitPdf() {
  const [doc, setDoc] = useState<{ file: File; pdf: PdfFile; pages: number } | null>(null);
  const [mode, setMode] = useState<SplitMode>("extract");
  const [ranges, setRanges] = useState("");
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<{ tone: "idle" | "success" | "error"; text: string }>({
    tone: "idle",
    text: "Your PDF stays on your device.",
  });

  useEffect(() => warmUpWorker(), []);

  const open = async ([file]: File[]) => {
    setWorking(true);
    const pdf = await toPdfFile(file);
    const r = await runTaskInWorker({ type: "pdf-count", file: pdf });
    setWorking(false);
    if (!r.ok) {
      setStatus({ tone: "error", text: r.message });
      return;
    }
    setDoc({ file, pdf, pages: r.value });
    setRanges(r.value > 1 ? `1-${Math.min(r.value, 3)}` : "1");
    setStatus({ tone: "idle", text: `${file.name} · ${r.value} ${r.value === 1 ? "page" : "pages"}` });
  };

  let rangeError = "";
  let selected = 0;
  if (doc && mode !== "every") {
    try {
      const groups = parsePageRanges(ranges, doc.pages);
      selected = groups.reduce((n, g) => n + g.length, 0);
      if (mode === "ranges") selected = groups.length;
    } catch (error) {
      rangeError = (error as Error).message;
    }
  }

  const split = async () => {
    if (!doc) return;
    setWorking(true);
    const r = await runTaskInWorker({ type: "pdf-split", file: doc.pdf, mode, ranges });
    setWorking(false);
    if (!r.ok) {
      setStatus({ tone: "error", text: r.message });
      return;
    }
    downloadBlob(pdfBlob(r.value.data, r.value.type), r.value.name);
    setStatus({
      tone: "success",
      text:
        r.value.files === 1
          ? `Saved ${r.value.name} (${formatBytes(r.value.data.length)}).`
          : `Saved ${r.value.files} PDFs in ${r.value.name} (${formatBytes(r.value.data.length)}).`,
    });
  };

  if (!doc)
    return (
      <Panel
        status={
          working ? (
            <StatusMessage tone="working">Opening…</StatusMessage>
          ) : (
            <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
          )
        }
      >
        <div className="p-4 sm:p-6">
          <FileDrop
            accept={PDF_ACCEPT}
            maxBytes={MAX_PDF_BYTES}
            title="Drop a PDF here"
            hint="Up to 100 MB."
            onFiles={open}
            onReject={(text) => setStatus({ tone: "error", text })}
          />
        </div>
      </Panel>
    );

  const help = modes.find((m) => m.value === mode)!.help;
  return (
    <Panel
      toolbar={
        <>
          <Button variant="primary" size="sm" onClick={split} disabled={working || !!rangeError}>
            {working && <LoaderCircle aria-hidden size={15} className="animate-spin" />}
            Split and download
          </Button>
          <Segmented
            label="Mode"
            value={mode}
            onChange={(v) => setMode(v as SplitMode)}
            choices={modes.map(({ value, label }) => ({ value, label }))}
          />
        </>
      }
      status={
        working ? (
          <StatusMessage tone="working">Splitting…</StatusMessage>
        ) : (
          <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
        )
      }
    >
      <PanelSection
        title="Document"
        actions={
          <IconButton
            icon={X}
            label="Remove PDF"
            size="sm"
            onClick={() => {
              setDoc(null);
              setStatus({ tone: "idle", text: "Your PDF stays on your device." });
            }}
          />
        }
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-cat-pdf-soft text-cat-pdf">
            <FileText aria-hidden size={18} strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{doc.file.name}</p>
            <p className="text-xs text-fg-muted">
              {doc.pages} {doc.pages === 1 ? "page" : "pages"} · {formatBytes(doc.file.size)}
            </p>
          </div>
        </div>
        <div className="space-y-2 border-t border-border p-4">
          {mode === "every" ? (
            <p className="text-sm text-fg-muted">
              {help} You will get {doc.pages} files.
            </p>
          ) : (
            <>
              <TextField
                label="Pages"
                hint={`1–${doc.pages}`}
                value={ranges}
                onChange={(event) => setRanges(event.target.value)}
                placeholder="e.g. 1-3, 5, 8-"
                spellCheck={false}
                aria-invalid={rangeError ? true : undefined}
                aria-describedby="split-ranges-help"
                className="max-w-md font-mono"
              />
              <p id="split-ranges-help" className="text-sm text-fg-muted">
                {rangeError ? (
                  <StatusMessage tone="error">{rangeError}</StatusMessage>
                ) : (
                  <>
                    {help}{" "}
                    {mode === "extract"
                      ? `${selected} ${selected === 1 ? "page" : "pages"} selected.`
                      : `${selected} ${selected === 1 ? "file" : "files"}.`}{" "}
                    Separate with commas; “8-” means page 8 to the end.
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </PanelSection>
    </Panel>
  );
}
