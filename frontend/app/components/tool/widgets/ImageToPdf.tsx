import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, Trash2 } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { jpegOrientation, type ImagesPdfOptions, type PdfImage } from "~/tools/engine/images-pdf";
import { Segmented } from "../OptionControls";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, PrimaryAction, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { MAX_IMAGE_BYTES } from "./image-shared";
import { pdfBlob } from "./pdf-shared";

type Item = { id: number; file: File; preview: string };

const MAX_FILES = 100;
const ACCEPT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif"];

function readSize(url: string) {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Upright JPEGs and PNGs go into the PDF untouched. Other formats, and
 * phone photos stored sideways (EXIF orientation), are redrawn as JPEG first.
 */
async function prepare(item: Item): Promise<PdfImage> {
  const size = await readSize(item.preview);
  if (!size) throw new Error(`Your browser cannot open “${item.file.name}”.`);
  const data = new Uint8Array(await item.file.arrayBuffer());
  const isJpeg = item.file.type === "image/jpeg" || /\.jpe?g$/i.test(item.file.name);
  const isPng = item.file.type === "image/png" || /\.png$/i.test(item.file.name);
  if (isPng) return { name: item.file.name, data, type: "image/png", ...size };
  if (isJpeg && jpegOrientation(data) === 1) return { name: item.file.name, data, type: "image/jpeg", ...size };
  const r = await runTaskInWorker({ type: "image", job: { file: item.file, ...size, mime: "image/jpeg", quality: 0.92 } });
  if (!r.ok) throw new Error(r.message);
  return { name: item.file.name, data: new Uint8Array(await r.value.arrayBuffer()), type: "image/jpeg", ...size };
}

export function ImageToPdf() {
  const [items, setItems] = useState<Item[]>([]);
  const [options, setOptions] = useState<ImagesPdfOptions>({ pageSize: "a4", orientation: "auto", margin: "small" });
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<{ tone: "idle" | "success" | "error" | "warning"; text: string }>({
    tone: "idle",
    text: "Add images, put them in order, then create the PDF.",
  });
  const nextId = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => warmUpWorker(), []);
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

  const add = (files: File[]) => {
    const room = MAX_FILES - items.length;
    const added = files.slice(0, Math.max(room, 0)).map((file) => ({ id: nextId.current++, file, preview: URL.createObjectURL(file) }));
    setItems((list) => [...list, ...added]);
    setStatus(
      files.length > room
        ? { tone: "warning", text: `Up to ${MAX_FILES} images per PDF; the extra files were skipped.` }
        : { tone: "idle", text: "Ready to create the PDF." },
    );
  };

  const move = (index: number, by: number) =>
    setItems((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });

  const remove = (item: Item) => {
    URL.revokeObjectURL(item.preview);
    setItems((list) => list.filter((i) => i.id !== item.id));
  };

  const create = async () => {
    setWorking(true);
    try {
      const images: PdfImage[] = [];
      for (const item of items) images.push(await prepare(item));
      const r = await runTaskInWorker({ type: "images-pdf", images, options });
      if (!r.ok) throw new Error(r.message);
      downloadBlob(pdfBlob(r.value.data), "images.pdf");
      setStatus({ tone: "success", text: `Created images.pdf: ${r.value.pageCount} pages, ${formatBytes(r.value.data.length)}.` });
    } catch (error) {
      setStatus({ tone: "error", text: String((error as Error).message ?? error) });
    }
    setWorking(false);
  };

  const set = (next: Partial<ImagesPdfOptions>) => setOptions((o) => ({ ...o, ...next }));

  return (
    <Panel
      action={
        <PrimaryAction icon={Download} busy={working} onClick={create} disabled={items.length === 0}>
          {items.length > 1 ? `Create PDF from ${items.length} images` : "Create PDF and download"}
        </PrimaryAction>
      }
      toolbar={
        <>
          <Segmented
            label="Page"
            value={options.pageSize}
            onChange={(v) => set({ pageSize: v as ImagesPdfOptions["pageSize"] })}
            choices={[
              { value: "a4", label: "A4" },
              { value: "letter", label: "Letter" },
              { value: "fit", label: "Same as image" },
            ]}
          />
          {options.pageSize !== "fit" && (
            <Segmented
              label="Orientation"
              value={options.orientation}
              onChange={(v) => set({ orientation: v as ImagesPdfOptions["orientation"] })}
              choices={[
                { value: "auto", label: "Auto" },
                { value: "portrait", label: "Portrait" },
                { value: "landscape", label: "Landscape" },
              ]}
            />
          )}
          <Segmented
            label="Margin"
            value={options.margin}
            onChange={(v) => set({ margin: v as ImagesPdfOptions["margin"] })}
            choices={[
              { value: "none", label: "None" },
              { value: "small", label: "Small" },
              { value: "large", label: "Large" },
            ]}
          />
        </>
      }
      status={working ? <StatusMessage tone="working">Creating the PDF…</StatusMessage> : <StatusMessage tone={status.tone}>{status.text}</StatusMessage>}
    >
      <div className="p-4 sm:p-5">
        <FileDrop
          accept={ACCEPT}
          multiple
          compact={items.length > 0}
          maxBytes={MAX_IMAGE_BYTES}
          title={items.length ? "Add more images" : "Drop images here"}
          hint="JPG, PNG, WebP, GIF, BMP or AVIF, up to 25 MB each. One image per page, in the order listed."
          onFiles={add}
          onReject={(text) => setStatus({ tone: "error", text })}
        />
      </div>
      {items.length > 0 && (
        <PanelSection title={`Pages · ${items.length}`} className="border-t border-border">
          <ol className="divide-y divide-border">
            {items.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                <span className="w-6 shrink-0 text-right font-mono text-sm text-fg-subtle">{index + 1}</span>
                <img src={item.preview} alt="" className="size-12 shrink-0 rounded-sm object-cover ring-1 ring-border" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{item.file.name}</p>
                  <p className="mt-0.5 text-xs text-fg-muted">{formatBytes(item.file.size)}</p>
                </div>
                <IconButton icon={ArrowUp} label={`Move ${item.file.name} up`} size="sm" disabled={index === 0} onClick={() => move(index, -1)} />
                <IconButton
                  icon={ArrowDown}
                  label={`Move ${item.file.name} down`}
                  size="sm"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                />
                <IconButton icon={Trash2} label={`Remove ${item.file.name}`} size="sm" onClick={() => remove(item)} />
              </li>
            ))}
          </ol>
        </PanelSection>
      )}
    </Panel>
  );
}
