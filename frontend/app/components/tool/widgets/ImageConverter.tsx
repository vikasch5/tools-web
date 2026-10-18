import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { RangeField } from "~/components/ui/Field";
import type { ImageMime } from "~/tools/engine/image";
import { convertedName, targetFormats } from "~/tools/engine/image-format";
import { createZip } from "~/tools/engine/zip";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { Segmented } from "../OptionControls";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { MAX_IMAGE_BYTES, encoderNote } from "./image-shared";

type Item = {
  id: number;
  file: File;
  preview: string;
  result?: { blob: Blob; name: string; width: number; height: number; note: string | null };
  error?: string;
};

type Settings = { mime: ImageMime; quality: number; background: string };

const MAX_FILES = 30;
const ACCEPT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif", ".ico"];
const backgrounds = [
  { value: "#ffffff", label: "White" },
  { value: "#000000", label: "Black" },
];

function readSize(url: string) {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Unique names inside a ZIP, so files with the same base name don't overwrite each other. */
function uniqueNames<T extends { name: string }>(files: T[]) {
  const seen = new Map<string, number>();
  return files.map((f) => {
    const n = (seen.get(f.name) ?? 0) + 1;
    seen.set(f.name, n);
    return n === 1 ? f : { ...f, name: f.name.replace(/(\.[^.]+)$/, `-${n}$1`) };
  });
}

export function ImageConverter() {
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState<Settings>({ mime: "image/webp", quality: 85, background: "#ffffff" });
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const nextId = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => warmUpWorker(), []);
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

  const convert = async (list: Item[], opts: Settings) => {
    if (!list.length) return;
    setWorking(true);
    const done: Item[] = [];
    for (const item of list) {
      const size = await readSize(item.preview);
      if (!size) {
        done.push({ ...item, result: undefined, error: "Your browser cannot open this image format." });
        continue;
      }
      const r = await runTaskInWorker({
        type: "image",
        job: { file: item.file, ...size, mime: opts.mime, quality: opts.quality / 100, background: opts.mime === "image/jpeg" ? opts.background : undefined },
      });
      done.push(
        r.ok
          ? {
              ...item,
              error: undefined,
              result: { blob: r.value, name: convertedName(item.file.name, r.value.type as ImageMime), ...size, note: encoderNote(opts.mime, r.value.type) },
            }
          : { ...item, result: undefined, error: r.message },
      );
    }
    setItems((current) => current.filter((c) => done.some((d) => d.id === c.id)).map((c) => done.find((d) => d.id === c.id)!));
    setWorking(false);
  };

  const update = (next: Partial<Settings>, run = true) => {
    const opts = { ...settings, ...next };
    setSettings(opts);
    if (run) convert(items, opts);
  };

  const add = (files: File[]) => {
    setMessage("");
    const room = MAX_FILES - items.length;
    if (files.length > room) setMessage(`Up to ${MAX_FILES} images at a time; the extra files were skipped.`);
    const added = files
      .slice(0, Math.max(room, 0))
      .map((file) => ({ id: nextId.current++, file, preview: URL.createObjectURL(file) }) as Item);
    const next = [...items, ...added];
    setItems(next);
    convert(next, settings);
  };

  const finished = items.filter((i) => i.result);
  const lossy = settings.mime !== "image/png";
  const label = targetFormats.find((f) => f.value === settings.mime)!.label;

  const downloadAll = async () => {
    if (finished.length === 1) return downloadBlob(finished[0].result!.blob, finished[0].result!.name);
    const files = await Promise.all(
      finished.map(async (i) => ({ name: i.result!.name, data: new Uint8Array(await i.result!.blob.arrayBuffer()) })),
    );
    downloadBlob(new Blob([createZip(uniqueNames(files))], { type: "application/zip" }), `converted-${label.toLowerCase()}.zip`);
  };

  return (
    <Panel
      toolbar={
        <>
          <Segmented
            label="Convert to"
            value={settings.mime}
            onChange={(v) => update({ mime: v as ImageMime })}
            choices={targetFormats.map(({ value, label }) => ({ value, label }))}
          />
          {lossy && (
            <RangeField
              label="Quality"
              valueText={`${settings.quality}%`}
              min={10}
              max={100}
              step={5}
              value={settings.quality}
              onChange={(event) => update({ quality: Number(event.target.value) }, false)}
              onPointerUp={() => convert(items, settings)}
              onKeyUp={(event) => event.key.startsWith("Arrow") && convert(items, settings)}
              className="w-44"
            />
          )}
          {settings.mime === "image/jpeg" && (
            <Segmented
              label="Transparent areas"
              value={settings.background}
              onChange={(v) => update({ background: v })}
              choices={backgrounds}
            />
          )}
          {finished.length > 0 && (
            <div className="ml-auto">
              <Button size="sm" variant="primary" icon={Download} onClick={downloadAll} disabled={working}>
                {finished.length > 1 ? "Download all (.zip)" : "Download"}
              </Button>
            </div>
          )}
        </>
      }
      status={
        working ? (
          <StatusMessage tone="working">Converting…</StatusMessage>
        ) : message ? (
          <StatusMessage tone="warning">{message}</StatusMessage>
        ) : finished.length > 0 ? (
          <StatusMessage tone="success">
            Converted {finished.length} {finished.length === 1 ? "image" : "images"} to {label}.
          </StatusMessage>
        ) : (
          <StatusMessage tone="idle">Images are converted on your device and never uploaded.</StatusMessage>
        )
      }
    >
      <div className="p-4 sm:p-5">
        <FileDrop
          accept={ACCEPT}
          multiple
          compact={items.length > 0}
          maxBytes={MAX_IMAGE_BYTES}
          title={items.length ? "Add more images" : "Drop images here"}
          hint={`JPG, PNG, WebP, GIF, BMP, AVIF or ICO, up to 25 MB each and ${MAX_FILES} at a time.`}
          onFiles={add}
          onReject={setMessage}
        />
      </div>

      {items.length > 0 && (
        <PanelSection title={`Images · ${items.length}`} className="border-t border-border">
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const r = item.result;
              return (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                  <img src={item.preview} alt="" className="size-12 shrink-0 rounded-sm object-cover ring-1 ring-border" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{r ? r.name : item.file.name}</p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {item.error ? (
                        <StatusMessage tone="error">{item.error}</StatusMessage>
                      ) : r ? (
                        <>
                          <span className="font-mono tabular-nums">
                            {formatBytes(item.file.size)} → {formatBytes(r.blob.size)} · {r.width} × {r.height} px
                          </span>
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
                    <IconButton icon={Download} label={`Download ${r.name}`} size="sm" onClick={() => downloadBlob(r.blob, r.name)} />
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
