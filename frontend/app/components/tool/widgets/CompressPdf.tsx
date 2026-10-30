import { useEffect, useState } from "react";
import { Download, Image as ImageIcon, Minimize2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { SelectField } from "~/components/ui/Field";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import type { PdfFile } from "~/tools/engine/pdf";
import { compressLevels, rasterSteps, sizeChange, type CompressLevel, type PageImage } from "~/tools/engine/pdf-compress";
import { targetLabel } from "~/tools/engine/image-target";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, PrimaryAction, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { pdfBlob, toPdfFile } from "./pdf-shared";
import { FileSummary, PdfDropPanel, type Status } from "./PdfChrome";
import { StatGrid } from "./results";
import { canvasToBlob, openPdfForRendering, renderPdfPage } from "./pdf-render";
import type { WidgetProps } from "./index";

const IDLE: Status = { tone: "idle", text: "Your PDF stays on your device." };

const levels: { value: CompressLevel; label: string; help: string }[] = [
  {
    value: "low",
    label: "Lossless",
    help: "Repacks the file without touching images or text. Nothing changes visually; savings are usually modest.",
  },
  {
    value: "medium",
    label: "Recommended",
    help: `Also re-encodes photos and scans as JPEG at ${compressLevels.medium!.quality}% quality and scales down images over ${compressLevels.medium!.maxEdge} px. Text stays sharp and selectable.`,
  },
  {
    value: "high",
    label: "Strong",
    help: `Images at ${compressLevels.high!.quality}% quality and at most ${compressLevels.high!.maxEdge} px: the smallest file, with softer photos. Text stays sharp and selectable.`,
  },
];

type Mode = "level" | "target";
const targetsKb = [100, 200, 300, 500, 1000, 2000, 5000];
/** Turning pages into images is slow for long documents. */
const MAX_RASTER_PAGES = 60;
const KB = 1000;

/** Savings under 1% are not worth a new file. */
const worthIt = (before: number, after: number) => before - after > before * 0.01;

type Result = {
  name: string;
  data: Uint8Array;
  before: number;
  after: number;
  /** Settings that produced it, to tell whether it is stale. */
  key: string;
  /** Target mode: still over the limit. */
  missed?: boolean;
  /** Pages were turned into images. */
  raster?: boolean;
};

/**
 * Renders every page to a JPEG and rebuilds the PDF, trying sharper
 * settings first, until it fits under `target` bytes.
 */
async function rasterizeToTarget(pdf: PdfFile, target: number, onProgress: (text: string) => void) {
  const doc = await openPdfForRendering(pdf.data);
  try {
    if (doc.numPages > MAX_RASTER_PAGES) throw new Error(`Turning pages into images works for up to ${MAX_RASTER_PAGES} pages.`);
    const sizes: { widthPt: number; heightPt: number }[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const viewport = page.getViewport({ scale: 1, rotation: page.rotate });
      sizes.push({ widthPt: viewport.width, heightPt: viewport.height });
    }
    let canvases: HTMLCanvasElement[] = [];
    let canvasDpi = 0;
    let smallest: Uint8Array | null = null;
    for (const [dpi, quality] of rasterSteps) {
      onProgress(`Trying page images at ${dpi} DPI…`);
      if (dpi !== canvasDpi) {
        canvases = [];
        for (let n = 1; n <= doc.numPages; n++) canvases.push(await renderPdfPage(doc, n, dpi / 72));
        canvasDpi = dpi;
      }
      const pages: PageImage[] = [];
      let total = 0;
      for (let i = 0; i < canvases.length; i++) {
        const jpeg = new Uint8Array(await (await canvasToBlob(canvases[i], "image/jpeg", quality)).arrayBuffer());
        total += jpeg.length;
        pages.push({ jpeg, ...sizes[i] });
      }
      // Each page adds a little structure on top of its image.
      if (total + pages.length * 300 > target && smallest) continue;
      const r = await runTaskInWorker({ type: "pdf-from-pages", pages });
      if (!r.ok) throw new Error(r.message);
      if (!smallest || r.value.length < smallest.length) smallest = r.value;
      if (r.value.length <= target) return { data: r.value, reached: true, dpi };
    }
    return { data: smallest!, reached: false, dpi: rasterSteps.at(-1)![0] };
  } finally {
    void doc.loadingTask.destroy();
  }
}

export function CompressPdf({ preset }: WidgetProps) {
  const [doc, setDoc] = useState<{ file: File; pdf: PdfFile } | null>(null);
  const [mode, setMode] = useState<Mode>(preset?.mode === "target" ? "target" : "level");
  const [level, setLevel] = useState<CompressLevel>("medium");
  const [targetKb, setTargetKb] = useState(Number(preset?.targetKb) || 500);
  const [result, setResult] = useState<Result | null>(null);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState("");
  const [status, setStatus] = useState<Status>(IDLE);

  useEffect(() => warmUpWorker(), []);

  if (!doc)
    return (
      <PdfDropPanel
        status={status}
        onFile={async (file) => {
          setStatus(IDLE);
          setResult(null);
          setDoc({ file, pdf: await toPdfFile(file) });
        }}
        onReject={(text) => setStatus({ tone: "error", text })}
      />
    );

  const key = mode === "level" ? `level:${level}` : `target:${targetKb}`;
  const target = targetKb * KB;

  const compress = async () => {
    setWorking(true);
    setResult(null);
    setProgress("");
    if (mode === "level") {
      const r = await runTaskInWorker({ type: "pdf-compress", file: doc.pdf, level });
      setWorking(false);
      if (!r.ok) return setStatus({ tone: "error", text: r.message });
      setResult({ ...r.value, key });
      return setStatus(
        worthIt(r.value.before, r.value.after)
          ? { tone: "success", text: `Compressed: ${formatBytes(r.value.before)} → ${formatBytes(r.value.after)} (${sizeChange(r.value.before, r.value.after)}).` }
          : {
              tone: "warning",
              text:
                level === "low"
                  ? "This PDF is already packed tightly. Try Recommended to shrink its images."
                  : "This PDF could not be made smaller; it is already well compressed.",
            },
      );
    }
    const r = await runTaskInWorker({ type: "pdf-compress-target", file: doc.pdf, target });
    setWorking(false);
    if (!r.ok) return setStatus({ tone: "error", text: r.message });
    const { name, data, before, after, reached, step } = r.value;
    setResult({ name, data, before, after, key, missed: !reached });
    setStatus(
      reached
        ? {
            tone: "success",
            text:
              before === after
                ? `Already under ${targetLabel(targetKb)} (${formatBytes(before)}): no change needed.`
                : `Now ${(after / KB).toFixed(1)} KB, under ${targetLabel(targetKb)}, using ${step}. Text stays selectable.`,
          }
        : {
            tone: "warning",
            text: `The smallest version with selectable text is ${(after / KB).toFixed(1)} KB, still over ${targetLabel(targetKb)}.`,
          },
    );
  };

  const rasterize = async () => {
    setWorking(true);
    try {
      const r = await rasterizeToTarget(doc.pdf, target, setProgress);
      const name = doc.pdf.name.replace(/\.pdf$/i, "") + `-${targetKb}kb.pdf`;
      setResult({ name, data: r.data, before: doc.pdf.data.length, after: r.data.length, key, missed: !r.reached, raster: true });
      setStatus(
        r.reached
          ? { tone: "success", text: `Now ${(r.data.length / KB).toFixed(1)} KB, under ${targetLabel(targetKb)}, with pages as ${r.dpi} DPI images. Text is no longer selectable.` }
          : { tone: "warning", text: `Even as small page images the PDF is ${(r.data.length / KB).toFixed(1)} KB. Try a larger limit or split the PDF.` },
      );
    } catch (error) {
      setStatus({ tone: "error", text: String((error as Error).message ?? error) });
    } finally {
      setWorking(false);
      setProgress("");
    }
  };

  const help = mode === "level" ? levels.find((l) => l.value === level)!.help : `Gets the PDF under ${targetLabel(targetKb)} with the gentlest compression that fits. Text and drawings stay as they are; only images get smaller.`;
  const fresh = result && result.key === key;
  const saved = result ? result.before - result.after : 0;
  const downloadable = !!fresh && (mode === "target" ? !result.missed || result.raster : worthIt(result.before, result.after));

  return (
    <Panel
      action={
        downloadable ? (
          <PrimaryAction icon={Download} onClick={() => downloadBlob(pdfBlob(result!.data), result!.name)}>
            Download {result!.missed ? "smallest" : "compressed"} PDF ({formatBytes(result!.after)})
          </PrimaryAction>
        ) : (
          <PrimaryAction icon={Minimize2} busy={working} onClick={compress}>
            {working ? "Compressing…" : fresh ? "Compress again" : "Compress PDF"}
          </PrimaryAction>
        )
      }
      toolbar={
        <>
          <Segmented
            label="Mode"
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            choices={[
              { value: "level", label: "Level" },
              { value: "target", label: "Size limit" },
            ]}
          />
          {mode === "level" ? (
            <Segmented
              label="Level"
              value={level}
              onChange={(v) => setLevel(v as CompressLevel)}
              choices={levels.map(({ value, label }) => ({ value, label }))}
            />
          ) : (
            <SelectField label="Target size" value={targetKb} onChange={(e) => setTargetKb(Number(e.target.value))} className="w-36">
              {targetsKb.map((kb) => (
                <option key={kb} value={kb}>
                  Under {targetLabel(kb)}
                </option>
              ))}
            </SelectField>
          )}
        </>
      }
      status={
        working ? (
          <StatusMessage tone="working">{progress || "Compressing… large scans can take a minute."}</StatusMessage>
        ) : (
          <StatusMessage tone={status.tone}>{status === IDLE ? help : status.text}</StatusMessage>
        )
      }
    >
      <FileSummary
        file={doc.file}
        onRemove={() => {
          setDoc(null);
          setResult(null);
          setStatus(IDLE);
        }}
      />
      {fresh && result.missed && !result.raster && (
        <div className="space-y-3 border-t border-border px-4 py-4">
          <p className="text-sm text-fg-muted">
            To reach {targetLabel(targetKb)}, each page can be saved as a picture at a lower resolution. The PDF will look
            the same on screen, but its text can no longer be selected, searched or copied.
          </p>
          <Button variant="secondary" icon={ImageIcon} onClick={rasterize} disabled={working}>
            Turn pages into images to reach {targetLabel(targetKb)}
          </Button>
        </div>
      )}
      {result && worthIt(result.before, result.after) && (
        <PanelSection title="Result" className="border-t border-border">
          <StatGrid
            stats={[
              { label: "Before", value: formatBytes(result.before) },
              { label: "After", value: formatBytes(result.after) },
              { label: "Change", value: sizeChange(result.before, result.after) },
              { label: "Saved", value: formatBytes(saved) },
            ]}
          />
          {!fresh && (
            <p className="border-t border-border px-4 py-3 text-sm text-fg-muted">
              This result is from different settings. Press Compress PDF to try the current ones.
            </p>
          )}
        </PanelSection>
      )}
    </Panel>
  );
}
