import { useEffect, useState } from "react";
import { Check, Download, FileText, LoaderCircle, X } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { pageImageName, pageImageSize } from "~/tools/engine/pdf-image";
import { createZip } from "~/tools/engine/zip";
import { cn } from "~/lib/cn";
import { Segmented } from "../OptionControls";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { MAX_PDF_BYTES, PDF_ACCEPT, toPdfFile } from "./pdf-shared";
import { canvasToBlob, renderPdfPage } from "./pdf-render";
import { usePdfDocument } from "./usePdfDocument";

const formats = [
  { value: "image/png", label: "PNG", extension: "png" },
  { value: "image/jpeg", label: "JPG", extension: "jpg" },
  { value: "image/webp", label: "WebP", extension: "webp" },
];
const resolutions = [
  { value: "72", label: "72 DPI" },
  { value: "150", label: "150 DPI" },
  { value: "300", label: "300 DPI" },
];

type Status = { tone: "idle" | "working" | "success" | "warning" | "error"; text: string };
const IDLE: Status = { tone: "idle", text: "Your PDF stays on your device." };

export function PdfToImage() {
  const [doc, setDoc] = useState<{ file: File; data: Uint8Array } | null>(null);
  const [format, setFormat] = useState("image/png");
  const [dpi, setDpi] = useState("150");
  const [selected, setSelected] = useState<boolean[]>([]);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<Status>(IDLE);
  const { pdf, thumbs, error } = usePdfDocument(doc?.data ?? null);

  useEffect(() => {
    if (pdf) setSelected(Array(pdf.numPages).fill(true));
  }, [pdf]);
  useEffect(() => {
    if (error) {
      setDoc(null);
      setStatus({ tone: "error", text: error });
    }
  }, [error]);

  const open = async ([file]: File[]) => {
    setStatus(IDLE);
    setDoc({ file, data: (await toPdfFile(file)).data });
  };

  const pages = selected.flatMap((on, i) => (on ? [i + 1] : []));
  const fmt = formats.find((f) => f.value === format)!;

  const convert = async () => {
    if (!doc || !pdf || !pages.length) return;
    setWorking(true);
    const files: { name: string; data: Uint8Array; blob: Blob }[] = [];
    let reduced = 0;
    try {
      for (const [n, pageNumber] of pages.entries()) {
        setStatus({ tone: "working", text: `Rendering page ${pageNumber} (${n + 1} of ${pages.length})…` });
        const page = await pdf.getPage(pageNumber);
        const { width, height } = page.getViewport({ scale: 1 });
        const size = pageImageSize(width, height, Number(dpi));
        if (size.reduced) reduced++;
        const canvas = await renderPdfPage(pdf, pageNumber, size.scale);
        const blob = await canvasToBlob(canvas, format, format === "image/png" ? undefined : 0.92);
        canvas.width = canvas.height = 0;
        const extension = formats.find((f) => f.value === blob.type)?.extension ?? "png";
        files.push({ name: pageImageName(doc.file.name, pageNumber, pdf.numPages, extension), blob, data: new Uint8Array() });
      }
      let total = 0;
      if (files.length === 1) {
        downloadBlob(files[0].blob, files[0].name);
        total = files[0].blob.size;
      } else {
        for (const f of files) f.data = new Uint8Array(await f.blob.arrayBuffer());
        const zip = createZip(files);
        total = zip.length;
        const base = doc.file.name.replace(/\.pdf$/i, "") || "document";
        downloadBlob(new Blob([zip as Uint8Array<ArrayBuffer>], { type: "application/zip" }), `${base}-images.zip`);
      }
      const notes = [
        reduced ? `${reduced} very large ${reduced === 1 ? "page was" : "pages were"} saved at a lower resolution to stay within browser limits.` : "",
        files.some((f) => !f.name.endsWith(`.${fmt.extension}`)) ? `Your browser cannot save ${fmt.label}, so PNG was used.` : "",
      ].filter(Boolean);
      setStatus({
        tone: notes.length ? "warning" : "success",
        text: `Saved ${files.length} ${files.length === 1 ? "image" : "images"} (${formatBytes(total)}).${notes.length ? " " + notes.join(" ") : ""}`,
      });
    } catch (e) {
      setStatus({ tone: "error", text: (e as Error).message });
    }
    setWorking(false);
  };

  if (!doc || !pdf)
    return (
      <Panel
        status={
          doc ? (
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

  const first = pages[0];
  return (
    <Panel
      toolbar={
        <>
          <Button variant="primary" size="sm" icon={working ? undefined : Download} onClick={convert} disabled={working || !pages.length}>
            {working && <LoaderCircle aria-hidden size={15} className="animate-spin" />}
            {pages.length > 1 ? `Convert ${pages.length} pages (.zip)` : "Convert and download"}
          </Button>
          <Segmented label="Format" value={format} onChange={setFormat} choices={formats.map(({ value, label }) => ({ value, label }))} />
          <Segmented label="Resolution" value={dpi} onChange={setDpi} choices={resolutions} />
        </>
      }
      status={
        working || status.tone !== "idle" ? (
          <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
        ) : (
          <StatusMessage tone="idle">
            {pages.length
              ? `${pages.length} of ${pdf.numPages} ${pdf.numPages === 1 ? "page" : "pages"} selected.`
              : "Select at least one page."}
          </StatusMessage>
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
              setStatus(IDLE);
            }}
          />
        }
      >
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-cat-pdf-soft text-cat-pdf">
            <FileText aria-hidden size={18} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{doc.file.name}</p>
            <p className="text-xs text-fg-muted">
              {pdf.numPages} {pdf.numPages === 1 ? "page" : "pages"} · {formatBytes(doc.file.size)}
              {first && <PageSize pdf={pdf} page={first} dpi={Number(dpi)} />}
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setSelected((s) => s.map(() => true))}>
              Select all
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected((s) => s.map(() => false))}>
              Select none
            </Button>
          </div>
        </div>
      </PanelSection>
      <ol className="grid grid-cols-2 gap-3 border-t border-border p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {selected.map((on, i) => (
          <li key={i}>
            <button
              type="button"
              aria-pressed={on}
              aria-label={`Page ${i + 1}`}
              onClick={() => setSelected((s) => s.map((v, j) => (j === i ? !v : v)))}
              className={cn(
                "relative flex w-full flex-col items-center gap-2 rounded-lg border p-2 transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                on ? "border-fg bg-surface" : "border-border bg-surface-2/40 opacity-60 hover:opacity-100",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-2 right-2 inline-flex size-5 items-center justify-center rounded-sm border",
                  on ? "border-fg bg-fg text-bg" : "border-border-strong bg-surface",
                )}
              >
                {on && <Check size={13} strokeWidth={2.5} />}
              </span>
              <span className="flex aspect-[3/4] w-full items-center justify-center">
                {thumbs[i] ? (
                  <img src={thumbs[i]} alt="" className="max-h-full max-w-full bg-surface shadow-sm ring-1 ring-border" />
                ) : (
                  <LoaderCircle aria-hidden size={18} className="animate-spin text-fg-subtle" />
                )}
              </span>
              <span className="text-xs tabular-nums text-fg-muted">{i + 1}</span>
            </button>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/** " · 1240 × 1754 px" for the first selected page at the chosen DPI. */
function PageSize({ pdf, page, dpi }: { pdf: NonNullable<ReturnType<typeof usePdfDocument>["pdf"]>; page: number; dpi: number }) {
  const [text, setText] = useState("");
  useEffect(() => {
    let live = true;
    pdf.getPage(page).then((p) => {
      const { width, height } = p.getViewport({ scale: 1 });
      const size = pageImageSize(width, height, dpi);
      if (live) setText(` · page ${page}: ${size.width} × ${size.height} px`);
    });
    return () => {
      live = false;
    };
  }, [pdf, page, dpi]);
  return <>{text}</>;
}
