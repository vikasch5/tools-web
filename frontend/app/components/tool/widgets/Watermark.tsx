import { useEffect, useState } from "react";
import { ImageUp, LoaderCircle, X } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { RangeField, TextField } from "~/components/ui/Field";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import type { PdfFile } from "~/tools/engine/pdf";
import { parsePageRanges } from "~/tools/engine/page-ranges";
import { watermarkInks, watermarkPlacements, type WatermarkImage, type WatermarkOptions } from "~/tools/engine/pdf-pages";
import { cn } from "~/lib/cn";
import { FileDrop } from "../FileDrop";
import { Segmented } from "../OptionControls";
import { Panel, PanelSection, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { pdfBlob, toPdfFile } from "./pdf-shared";
import { usePdfDocument } from "./usePdfDocument";
import { FileSummary, PdfDropPanel, pageWord, type Status } from "./PdfChrome";
import { PagePreview, usePageSize } from "./PdfPreview";

const IDLE: Status = { tone: "idle", text: "Your PDF stays on your device." };
type Ink = (typeof watermarkInks)[number]["value"];
type Mark = WatermarkImage & { url: string };

/**
 * Draws the text with the device's own fonts, so any script works
 * (Devanagari, Arabic, CJK), and returns it as a tightly cropped PNG.
 */
async function renderTextMark(text: string, ink: string): Promise<Mark> {
  const size = 160;
  const font = `700 ${size}px ui-sans-serif, system-ui, "Segoe UI", Roboto, "Noto Sans", sans-serif`;
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = font;
  const m = probe.measureText(text);
  const pad = Math.round(size * 0.08);
  const ascent = Math.ceil(m.actualBoundingBoxAscent || size * 0.8);
  const descent = Math.ceil(m.actualBoundingBoxDescent || size * 0.2);
  const left = Math.ceil(m.actualBoundingBoxLeft || 0);
  const width = Math.ceil((m.actualBoundingBoxRight || m.width) + left) + pad * 2;
  const height = ascent + descent + pad * 2;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  ctx.fillStyle = ink;
  ctx.fillText(text, pad + left, pad + ascent);
  return toMark(canvas);
}

async function toMark(canvas: HTMLCanvasElement): Promise<Mark> {
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("The watermark could not be drawn."))), "image/png"),
  );
  return {
    data: new Uint8Array(await blob.arrayBuffer()),
    type: "image/png",
    width: canvas.width,
    height: canvas.height,
    url: URL.createObjectURL(blob),
  };
}

/** JPEG and PNG logos are used as they are; WebP and GIF are redrawn as PNG. */
async function imageMark(file: File): Promise<Mark> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`“${file.name}” could not be opened as an image. Use PNG or JPG.`);
  }
  const { width, height } = bitmap;
  if (file.type === "image/png" || file.type === "image/jpeg") {
    bitmap.close();
    return {
      data: new Uint8Array(await file.arrayBuffer()),
      type: file.type,
      width,
      height,
      url: URL.createObjectURL(file),
    };
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close();
  return toMark(canvas);
}

const angles = [
  { value: "45", label: "Diagonal" },
  { value: "0", label: "Flat" },
  { value: "90", label: "Upright" },
];

export function Watermark() {
  const [doc, setDoc] = useState<{ file: File; pdf: PdfFile } | null>(null);
  const [status, setStatus] = useState<Status>(IDLE);
  const [working, setWorking] = useState(false);
  const [kind, setKind] = useState<"text" | "image">("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [ink, setInk] = useState<Ink>("grey");
  const [logo, setLogo] = useState<{ name: string; mark: Mark } | null>(null);
  const [mark, setMark] = useState<Mark | null>(null);
  const [options, setOptions] = useState<WatermarkOptions>({
    scale: 0.6,
    opacity: 0.25,
    angle: 45,
    layout: "center",
    pages: "",
  });
  const { pdf, thumbs, error } = usePdfDocument(doc?.pdf.data ?? null);
  const size = usePageSize(pdf, 1);

  useEffect(() => warmUpWorker(), []);
  useEffect(() => {
    if (error) {
      setDoc(null);
      setStatus({ tone: "error", text: error });
    }
  }, [error]);

  // Redraw the text mark as it is typed; logos are drawn once on upload.
  useEffect(() => {
    if (kind === "image") return setMark(logo?.mark ?? null);
    if (!text.trim()) return setMark(null);
    let cancelled = false;
    const css = watermarkInks.find((i) => i.value === ink)!.css;
    const timer = setTimeout(async () => {
      const made = await renderTextMark(text.trim(), css);
      if (cancelled) return URL.revokeObjectURL(made.url);
      // The old text mark stays visible until the new one is ready.
      setMark((old) => {
        if (old && old !== logo?.mark) URL.revokeObjectURL(old.url);
        return made;
      });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [kind, text, ink, logo]);
  useEffect(
    () => () => {
      if (logo) URL.revokeObjectURL(logo.mark.url);
    },
    [logo],
  );

  if (!doc || !pdf)
    return (
      <PdfDropPanel
        status={status}
        opening={!!doc}
        onFile={async (file) => {
          setStatus(IDLE);
          setDoc({ file, pdf: await toPdfFile(file) });
        }}
        onReject={(t) => setStatus({ tone: "error", text: t })}
      />
    );

  const set = <K extends keyof WatermarkOptions>(key: K, value: WatermarkOptions[K]) =>
    setOptions((o) => ({ ...o, [key]: value }));

  let pagesError = "";
  let marked = pdf.numPages;
  if (options.pages.trim())
    try {
      marked = new Set(parsePageRanges(options.pages, pdf.numPages).flat()).size;
    } catch (e) {
      pagesError = (e as Error).message;
    }
  const problem =
    pagesError || (!mark ? (kind === "text" ? "Type the watermark text." : "Choose a logo or image to stamp.") : "");

  const save = async () => {
    if (!mark) return;
    setWorking(true);
    const { url: _url, ...image } = mark;
    const r = await runTaskInWorker({ type: "pdf-watermark", file: doc.pdf, image, options });
    setWorking(false);
    if (!r.ok) return setStatus({ tone: "error", text: r.message });
    downloadBlob(pdfBlob(r.value.data), r.value.name);
    setStatus({
      tone: "success",
      text: `Saved ${r.value.name}: ${pageWord(r.value.marked)} watermarked (${formatBytes(r.value.data.length)}).`,
    });
  };

  const overlay =
    mark && size
      ? (() => {
          const width = size.width * options.scale;
          const height = (width * mark.height) / mark.width;
          return watermarkPlacements(size, { width, height }, options.angle, options.layout).map((p, i) => (
            <img
              key={i}
              src={mark.url}
              alt=""
              className="absolute max-w-none origin-bottom-left"
              style={{
                left: `${(p.u / size.width) * 100}%`,
                bottom: `${(p.v / size.height) * 100}%`,
                width: `${options.scale * 100}%`,
                opacity: options.opacity,
                // PDF angles turn counter-clockwise; CSS turns clockwise.
                transform: `rotate(${-options.angle}deg)`,
              }}
            />
          ));
        })()
      : null;

  return (
    <Panel
      toolbar={
        <>
          <Button variant="primary" size="sm" onClick={save} disabled={working || !!problem}>
            {working && <LoaderCircle aria-hidden size={15} className="animate-spin" />}
            Add watermark and download
          </Button>
          <Segmented
            label="Watermark"
            value={kind}
            onChange={(v) => setKind(v as "text" | "image")}
            choices={[
              { value: "text", label: "Text" },
              { value: "image", label: "Image" },
            ]}
          />
        </>
      }
      status={
        working ? (
          <StatusMessage tone="working">Adding watermark…</StatusMessage>
        ) : problem ? (
          <StatusMessage tone={pagesError ? "error" : "idle"}>{problem}</StatusMessage>
        ) : status !== IDLE ? (
          <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
        ) : (
          <StatusMessage tone="idle">The watermark will be added to {pageWord(marked)}.</StatusMessage>
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
      <div className="grid border-t border-border md:grid-cols-[1fr_minmax(0,20rem)]">
        <PanelSection title="Settings" className="md:border-r md:border-border">
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            {kind === "text" ? (
              <>
                <TextField
                  label="Watermark text"
                  value={text}
                  maxLength={60}
                  onChange={(e) => setText(e.target.value)}
                  className="sm:col-span-2"
                />
                <fieldset className="flex flex-col gap-1.5 sm:col-span-2">
                  <legend className="mb-1.5 text-[0.8125rem] font-medium text-fg-muted">Colour</legend>
                  <div className="flex flex-wrap gap-2">
                    {watermarkInks.map((i) => (
                      <label
                        key={i.value}
                        className={cn(
                          "inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-[0.8125rem] font-medium pointer-coarse:h-11",
                          "has-focus-visible:outline-2 has-focus-visible:outline-ring",
                          ink === i.value ? "border-fg text-fg" : "border-border text-fg-muted hover:border-border-strong",
                        )}
                      >
                        <input
                          type="radio"
                          name="watermark-ink"
                          value={i.value}
                          checked={ink === i.value}
                          onChange={() => setInk(i.value)}
                          className="sr-only"
                        />
                        <span aria-hidden className="size-3.5 rounded-full ring-1 ring-border" style={{ background: i.css }} />
                        {i.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            ) : logo ? (
              <div className="flex items-center gap-3 rounded-md border border-border p-2 sm:col-span-2">
                <img src={logo.mark.url} alt="" className="size-12 rounded-sm bg-surface-2 object-contain" />
                <p className="min-w-0 flex-1 truncate text-sm text-fg">{logo.name}</p>
                <IconButton icon={X} label="Remove image" size="sm" onClick={() => setLogo(null)} />
              </div>
            ) : (
              <div className="sm:col-span-2">
                <FileDrop
                  compact
                  accept={[".png", ".jpg", ".jpeg", ".webp", ".gif"]}
                  maxBytes={10 * 1024 * 1024}
                  title="Drop a logo or image"
                  hint="PNG with transparency works best. Up to 10 MB."
                  onFiles={async ([file]) => {
                    try {
                      setLogo({ name: file.name, mark: await imageMark(file) });
                    } catch (e) {
                      setStatus({ tone: "error", text: (e as Error).message });
                    }
                  }}
                  onReject={(t) => setStatus({ tone: "error", text: t })}
                />
              </div>
            )}
            <RangeField
              label="Size"
              valueText={`${Math.round(options.scale * 100)}% of page width`}
              min={10}
              max={100}
              step={5}
              value={Math.round(options.scale * 100)}
              onChange={(e) => set("scale", Number(e.target.value) / 100)}
            />
            <RangeField
              label="Opacity"
              valueText={`${Math.round(options.opacity * 100)}%`}
              min={5}
              max={100}
              step={5}
              value={Math.round(options.opacity * 100)}
              onChange={(e) => set("opacity", Number(e.target.value) / 100)}
            />
            <div className="flex flex-col gap-3 sm:col-span-2">
              <Segmented label="Angle" value={String(options.angle)} onChange={(v) => set("angle", Number(v))} choices={angles} />
              <Segmented
                label="Layout"
                value={options.layout}
                onChange={(v) => set("layout", v as WatermarkOptions["layout"])}
                choices={[
                  { value: "center", label: "Once, centred" },
                  { value: "tile", label: "Repeated" },
                ]}
              />
            </div>
            <TextField
              label="Pages"
              hint="Empty = all"
              value={options.pages}
              onChange={(e) => set("pages", e.target.value)}
              placeholder="e.g. 1-3, 7"
              spellCheck={false}
              aria-invalid={pagesError ? true : undefined}
              className="font-mono sm:col-span-2"
            />
          </div>
        </PanelSection>
        <PanelSection title="Preview">
          <div className="p-4">
            <PagePreview src={thumbs[0]} size={size} label="Page 1 with the watermark" caption="Page 1">
              {overlay}
            </PagePreview>
            {kind === "image" && !logo && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-fg-subtle">
                <ImageUp aria-hidden size={14} /> Add an image to see it here.
              </p>
            )}
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
