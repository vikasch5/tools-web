import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { SelectField, TextField } from "~/components/ui/Field";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import type { PdfFile } from "~/tools/engine/pdf";
import {
  PAGE_NUMBER_INK,
  labelOrigin,
  planPageNumbers,
  type NumberFormat,
  type NumberPosition,
  type PageNumberOptions,
} from "~/tools/engine/pdf-pages";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, PrimaryAction, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { pdfBlob, toPdfFile } from "./pdf-shared";
import { usePdfDocument } from "./usePdfDocument";
import { FileSummary, PdfDropPanel, pageWord, type Status } from "./PdfChrome";
import { PagePreview, usePageSize } from "./PdfPreview";

const IDLE: Status = { tone: "idle", text: "Your PDF stays on your device." };

const positions: { value: NumberPosition; label: string }[] = [
  { value: "bottom-center", label: "Bottom centre" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "top-center", label: "Top centre" },
  { value: "top-right", label: "Top right" },
  { value: "top-left", label: "Top left" },
];
const formats: { value: NumberFormat; label: string }[] = [
  { value: "n", label: "1" },
  { value: "page-n", label: "Page 1" },
  { value: "n-of-total", label: "1 of 12" },
  { value: "page-n-of-total", label: "Page 1 of 12" },
];
const sizes = [
  { value: "9", label: "Small" },
  { value: "11", label: "Medium" },
  { value: "14", label: "Large" },
];

/** Helvetica's average digit and letter width, close enough for a preview. */
const approxWidth = (text: string, size: number) => text.length * size * 0.52;

export function PageNumbers() {
  const [doc, setDoc] = useState<{ file: File; pdf: PdfFile } | null>(null);
  const [status, setStatus] = useState<Status>(IDLE);
  const [working, setWorking] = useState(false);
  const [options, setOptions] = useState<PageNumberOptions>({
    position: "bottom-center",
    format: "n",
    start: 1,
    size: 11,
    pages: "",
  });
  const [startText, setStartText] = useState("1");
  const { pdf, thumbs, error } = usePdfDocument(doc?.pdf.data ?? null);

  useEffect(() => warmUpWorker(), []);
  useEffect(() => {
    if (error) {
      setDoc(null);
      setStatus({ tone: "error", text: error });
    }
  }, [error]);

  let plan: ReturnType<typeof planPageNumbers> = [];
  let problem = "";
  if (pdf) {
    try {
      if (!/^\d{1,5}$/.test(startText.trim())) throw new Error("The first number must be a whole number, 0 or more.");
      plan = planPageNumbers(pdf.numPages, { ...options, start: Number(startText) });
    } catch (e) {
      problem = (e as Error).message;
    }
  }
  const first = plan[0];
  const size = usePageSize(pdf, first ? first.index + 1 : 1);

  if (!doc || !pdf)
    return (
      <PdfDropPanel
        status={status}
        opening={!!doc}
        onFile={async (file) => {
          setStatus(IDLE);
          setDoc({ file, pdf: await toPdfFile(file) });
        }}
        onReject={(text) => setStatus({ tone: "error", text })}
      />
    );

  const set = <K extends keyof PageNumberOptions>(key: K, value: PageNumberOptions[K]) =>
    setOptions((o) => ({ ...o, [key]: value }));

  const save = async () => {
    setWorking(true);
    const r = await runTaskInWorker({
      type: "pdf-page-numbers",
      file: doc.pdf,
      options: { ...options, start: Number(startText) },
    });
    setWorking(false);
    if (!r.ok) return setStatus({ tone: "error", text: r.message });
    downloadBlob(pdfBlob(r.value.data), r.value.name);
    setStatus({
      tone: "success",
      text: `Saved ${r.value.name}: ${pageWord(r.value.numbered)} numbered (${formatBytes(r.value.data.length)}).`,
    });
  };

  let overlay = null;
  if (first && size) {
    const width = approxWidth(first.label, options.size);
    const { u, v } = labelOrigin(options.position, size, width, options.size);
    overlay = (
      <span
        className="absolute leading-none whitespace-nowrap"
        style={{
          left: `${(u / size.width) * 100}%`,
          // Baseline sits at v; the text box's bottom is a little below it.
          bottom: `${((v - options.size * 0.2) / size.height) * 100}%`,
          fontSize: `${(options.size / size.width) * 100}cqw`,
          fontFamily: "Helvetica, Arial, sans-serif",
          color: PAGE_NUMBER_INK.css,
        }}
      >
        {first.label}
      </span>
    );
  }

  return (
    <Panel
      action={
        <PrimaryAction icon={Download} busy={working} onClick={save} disabled={!!problem}>
          Add numbers and download
        </PrimaryAction>
      }
      status={
        working ? (
          <StatusMessage tone="working">Adding page numbers…</StatusMessage>
        ) : problem ? (
          <StatusMessage tone="error">{problem}</StatusMessage>
        ) : status !== IDLE ? (
          <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
        ) : (
          <StatusMessage tone="idle">
            {pageWord(plan.length)} will be numbered, from “{plan[0]?.label}” to “{plan[plan.length - 1]?.label}”.
          </StatusMessage>
        )
      }
    >
      <FileSummary
        file={doc.file}
        detail={pageWord(pdf.numPages)}
        onRemove={() => {
          setDoc(null);
          setStatus(IDLE);
        }}
      />
      <div className="grid gap-0 border-t border-border md:grid-cols-[1fr_minmax(0,20rem)]">
        <PanelSection title="Settings" className="md:border-r md:border-border">
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <SelectField
              label="Position"
              value={options.position}
              onChange={(e) => set("position", e.target.value as NumberPosition)}
            >
              {positions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </SelectField>
            <SelectField label="Format" value={options.format} onChange={(e) => set("format", e.target.value as NumberFormat)}>
              {formats.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </SelectField>
            <TextField
              label="First number"
              inputMode="numeric"
              value={startText}
              onChange={(e) => setStartText(e.target.value)}
              aria-invalid={problem.startsWith("The first") ? true : undefined}
            />
            <TextField
              label="Pages to number"
              hint="Empty = all"
              value={options.pages}
              onChange={(e) => set("pages", e.target.value)}
              placeholder="e.g. 2- to skip the cover"
              spellCheck={false}
              className="font-mono"
            />
            <div className="sm:col-span-2">
              <Segmented label="Size" value={String(options.size)} onChange={(v) => set("size", Number(v))} choices={sizes} />
            </div>
          </div>
        </PanelSection>
        <PanelSection title="Preview">
          <div className="p-4">
            <PagePreview
              src={first ? thumbs[first.index] : undefined}
              size={size}
              label={first ? `Page ${first.index + 1} with its number` : "No page selected"}
              caption={first ? `Page ${first.index + 1}, the first numbered page` : undefined}
            >
              {overlay}
            </PagePreview>
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
