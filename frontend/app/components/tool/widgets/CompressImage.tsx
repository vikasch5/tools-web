import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { RangeField, SelectField } from "~/components/ui/Field";
import { limitLongEdge, type Size } from "~/tools/engine/image-geometry";
import { createZip } from "~/tools/engine/zip";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { Segmented } from "../OptionControls";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import {
  IMAGE_ACCEPT,
  MAX_IMAGE_BYTES,
  encoderNote,
  formatChoices,
  mimeFor,
  outputName,
  type FormatChoice,
} from "./image-shared";

type Item = {
  id: number;
  file: File;
  preview: string;
  size: Size | null;
  result?: { blob: Blob; name: string; size: Size; kept: boolean; note: string | null };
  error?: string;
};

const MAX_FILES = 30;

function readSize(url: string) {
  return new Promise<Size | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function CompressImage() {
  const [items, setItems] = useState<Item[]>([]);
  const [format, setFormat] = useState<FormatChoice>("same");
  const [quality, setQuality] = useState(75);
  const [maxSide, setMaxSide] = useState("0");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const nextId = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => warmUpWorker(), []);
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

  const add = async (files: File[]) => {
    setMessage("");
    const room = MAX_FILES - items.length;
    if (files.length > room) setMessage(`Up to ${MAX_FILES} images at a time; the extra files were skipped.`);
    const added = await Promise.all(
      files.slice(0, Math.max(room, 0)).map(async (file) => {
        const preview = URL.createObjectURL(file);
        return { id: nextId.current++, file, preview, size: await readSize(preview) } as Item;
      }),
    );
    const next = [...items, ...added];
    setItems(next);
    compress(next);
  };

  const compress = async (
    list = items,
    opts = { format, quality, maxSide: Number(maxSide) },
  ) => {
    if (!list.length) return;
    setWorking(true);
    const done: Item[] = [];
    for (const item of list) {
      if (!item.size) {
        done.push({ ...item, error: "Could not open this image.", result: undefined });
        continue;
      }
      const size = limitLongEdge(item.size, opts.maxSide);
      const mime = mimeFor(item.file, opts.format);
      const r = await runTaskInWorker({
        type: "image",
        job: { file: item.file, width: size.width, height: size.height, mime, quality: opts.quality / 100 },
      });
      if (!r.ok) {
        done.push({ ...item, error: r.message, result: undefined });
        continue;
      }
      // Never hand back a bigger file than the original at the same size.
      const sameShape = size.width === item.size.width && mime === item.file.type;
      const kept = sameShape && r.value.size >= item.file.size;
      done.push({
        ...item,
        error: undefined,
        result: {
          blob: kept ? item.file : r.value,
          name: kept ? item.file.name : outputName(item.file, r.value.type, "compressed"),
          size,
          kept,
          note: kept ? null : encoderNote(mime, r.value.type),
        },
      });
    }
    // Keep items removed while compressing out of the list.
    setItems((current) => current.filter((c) => done.some((d) => d.id === c.id)).map((c) => done.find((d) => d.id === c.id)!));
    setWorking(false);
  };

  const change = (next: Partial<{ format: FormatChoice; quality: number; maxSide: string }>) => {
    const opts = {
      format: next.format ?? format,
      quality: next.quality ?? quality,
      maxSide: next.maxSide ?? maxSide,
    };
    if (next.format) setFormat(next.format);
    if (next.quality !== undefined) setQuality(next.quality);
    if (next.maxSide) setMaxSide(next.maxSide);
    return opts;
  };

  const before = items.reduce((n, i) => n + i.file.size, 0);
  const after = items.reduce((n, i) => n + (i.result?.blob.size ?? i.file.size), 0);
  const finished = items.filter((i) => i.result);
  const saved = before > 0 ? Math.round((1 - after / before) * 100) : 0;
  const lossy = format !== "png";

  const downloadAll = () => {
    if (finished.length === 1) return downloadBlob(finished[0].result!.blob, finished[0].result!.name);
    Promise.all(
      finished.map(async (i) => ({ name: i.result!.name, data: new Uint8Array(await i.result!.blob.arrayBuffer()) })),
    ).then((files) => {
      // Duplicate names would overwrite each other in the archive.
      const seen = new Map<string, number>();
      const unique = files.map((f) => {
        const n = (seen.get(f.name) ?? 0) + 1;
        seen.set(f.name, n);
        return n === 1 ? f : { ...f, name: f.name.replace(/(\.[^.]+)$/, `-${n}$1`) };
      });
      downloadBlob(new Blob([createZip(unique)], { type: "application/zip" }), "compressed-images.zip");
    });
  };

  return (
    <Panel
      toolbar={
        <>
          <Segmented
            label="Format"
            value={format}
            onChange={(v) => compress(items, { ...change({ format: v as FormatChoice }), maxSide: Number(maxSide) })}
            choices={formatChoices}
          />
          {lossy && (
            <RangeField
              label="Quality"
              valueText={`${quality}%`}
              min={10}
              max={95}
              step={5}
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              onPointerUp={() => compress()}
              onKeyUp={(event) => event.key.startsWith("Arrow") && compress()}
              className="w-44"
            />
          )}
          <SelectField
            label="Max size"
            value={maxSide}
            onChange={(event) => {
              const opts = change({ maxSide: event.target.value });
              compress(items, { ...opts, maxSide: Number(opts.maxSide) });
            }}
            className="w-40"
          >
            <option value="0">Keep dimensions</option>
            <option value="3840">3840 px (4K)</option>
            <option value="2560">2560 px</option>
            <option value="1920">1920 px (Full HD)</option>
            <option value="1280">1280 px</option>
            <option value="800">800 px</option>
          </SelectField>
          {finished.length > 0 && (
            <div className="ml-auto">
              <Button size="sm" variant="primary" icon={Download} onClick={downloadAll} disabled={working}>
                {finished.length > 1 ? `Download all (.zip)` : "Download"}
              </Button>
            </div>
          )}
        </>
      }
      status={
        working ? (
          <StatusMessage tone="working">Compressing…</StatusMessage>
        ) : message ? (
          <StatusMessage tone="warning">{message}</StatusMessage>
        ) : finished.length > 0 ? (
          <StatusMessage tone="success">
            {formatBytes(before)} → {formatBytes(after)}
            {saved > 0 ? ` (−${saved}%)` : ""} across {finished.length} {finished.length === 1 ? "image" : "images"}.
          </StatusMessage>
        ) : (
          <StatusMessage tone="idle">Images are compressed on your device and never uploaded.</StatusMessage>
        )
      }
    >
      <div className="p-4 sm:p-5">
        <FileDrop
          accept={IMAGE_ACCEPT}
          multiple
          compact={items.length > 0}
          maxBytes={MAX_IMAGE_BYTES}
          title={items.length ? "Add more images" : "Drop images here"}
          hint={`JPG, PNG or WebP, up to 25 MB each and ${MAX_FILES} at a time.`}
          onFiles={add}
          onReject={setMessage}
        />
      </div>

      {items.length > 0 && (
        <PanelSection title={`Images · ${items.length}`} className="border-t border-border">
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const r = item.result;
              const pct = r ? Math.round((1 - r.blob.size / item.file.size) * 100) : 0;
              return (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                  <img src={item.preview} alt="" className="size-12 shrink-0 rounded-sm object-cover ring-1 ring-border" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{item.file.name}</p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {item.error ? (
                        <StatusMessage tone="error">{item.error}</StatusMessage>
                      ) : r ? (
                        <>
                          <span className="font-mono tabular-nums">
                            {formatBytes(item.file.size)} → {formatBytes(r.blob.size)}
                          </span>{" "}
                          {r.kept ? (
                            <StatusMessage tone="warning">Already well compressed: original kept.</StatusMessage>
                          ) : (
                            <span className="font-semibold text-success">
                              {pct > 0 ? `−${pct}%` : `+${-pct}%`}
                            </span>
                          )}
                          {r.size.width !== item.size?.width && ` · ${r.size.width} × ${r.size.height} px`}
                          {r.note && <span className="block text-warning">{r.note}</span>}
                        </>
                      ) : working ? (
                        <span className="inline-flex items-center gap-1">
                          <LoaderCircle aria-hidden size={12} className="animate-spin" /> Waiting…
                        </span>
                      ) : (
                        formatBytes(item.file.size)
                      )}
                    </p>
                  </div>
                  {r && (
                    <IconButton
                      icon={Download}
                      label={`Download ${r.name}`}
                      size="sm"
                      onClick={() => downloadBlob(r.blob, r.name)}
                    />
                  )}
                  <IconButton
                    icon={Trash2}
                    label={`Remove ${item.file.name}`}
                    size="sm"
                    onClick={() => {
                      URL.revokeObjectURL(item.preview);
                      setItems((list) => list.filter((i) => i.id !== item.id));
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </PanelSection>
      )}
    </Panel>
  );
}
