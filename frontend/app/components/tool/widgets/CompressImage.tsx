import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, Trash2 } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { RangeField, SelectField } from "~/components/ui/Field";
import { limitLongEdge, type Size } from "~/tools/engine/image-geometry";
import { createZip } from "~/tools/engine/zip";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import {
  MAX_TARGET_KB,
  MIN_TARGET_KB,
  describeTarget,
  targetBytes,
  targetLabel,
  targetPresetsKb,
} from "~/tools/engine/image-target";
import { TextField } from "~/components/ui/Field";
import type { WidgetProps } from "./index";
import { Segmented } from "../OptionControls";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, PrimaryAction, StatusMessage, downloadBlob } from "../Panel";
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
  result?: {
    blob: Blob;
    name: string;
    size: Size;
    kept: boolean;
    note: string | null;
    /** Target-size mode: how the file was fitted. */
    target?: { text: string; reached: boolean };
  };
  error?: string;
};

const MAX_FILES = 30;

type Mode = "quality" | "target";
type Options = { mode: Mode; format: FormatChoice; quality: number; maxSide: number; targetKb: number };

const modeChoices = [
  { value: "quality", label: "Quality" },
  { value: "target", label: "Size limit" },
];
const targetFormatChoices = formatChoices.filter((c) => c.value !== "png");

/** Target mode saves JPEG or WebP: PNG has no quality to lower. */
function targetMime(file: File, format: FormatChoice) {
  if (format === "webp" || (format === "same" && file.type === "image/webp")) return "image/webp" as const;
  return "image/jpeg" as const;
}

function readSize(url: string) {
  return new Promise<Size | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Fits one image under the target size, keeping the original if it already fits. */
async function fitTarget(item: Item, original: Size, size: Size, opts: Options): Promise<Item> {
  const limit = targetBytes(opts.targetKb);
  const mime = targetMime(item.file, opts.format);
  const untouched = size.width === original.width && mime === item.file.type;
  if (untouched && item.file.size <= limit) {
    return {
      ...item,
      error: undefined,
      result: {
        blob: item.file,
        name: item.file.name,
        size,
        kept: true,
        note: null,
        target: { text: `Already under ${targetLabel(opts.targetKb)}: original kept.`, reached: true },
      },
    };
  }
  const r = await runTaskInWorker({
    type: "image-target",
    job: { file: item.file, width: size.width, height: size.height, mime, target: limit },
  });
  if (!r.ok) return { ...item, error: r.message, result: undefined };
  const { blob, quality, scale, reached, width, height } = r.value;
  const pngNote = item.file.type === "image/png" ? "PNG has no quality setting, so it was saved as JPG." : null;
  return {
    ...item,
    error: undefined,
    result: {
      blob,
      name: outputName(item.file, blob.type, `${opts.targetKb}kb`),
      size: { width, height },
      kept: false,
      note: encoderNote(mime, blob.type) ?? (blob.type === "image/jpeg" ? pngNote : null),
      target: { text: describeTarget(size, { size: blob.size, quality, scale, reached }, opts.targetKb), reached },
    },
  };
}

export function CompressImage({ preset }: WidgetProps) {
  const presetKb = Number(preset?.targetKb) || 50;
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<Mode>(preset?.mode === "target" ? "target" : "quality");
  const [targetKb, setTargetKb] = useState(presetKb);
  const [customKb, setCustomKb] = useState(String(presetKb));
  const [custom, setCustom] = useState(!targetPresetsKb.includes(presetKb as (typeof targetPresetsKb)[number]));
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

  const current = (): Options => ({ mode, format, quality, maxSide: Number(maxSide), targetKb });

  const compress = async (list = items, opts: Options = current()) => {
    if (!list.length) return;
    setWorking(true);
    const done: Item[] = [];
    for (const item of list) {
      if (!item.size) {
        done.push({ ...item, error: "Could not open this image.", result: undefined });
        continue;
      }
      const size = limitLongEdge(item.size, opts.maxSide);
      if (opts.mode === "target") {
        done.push(await fitTarget(item, item.size, size, opts));
        continue;
      }
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

  const change = (next: Partial<Options>) => {
    const opts = { ...current(), ...next };
    if (next.mode) setMode(next.mode);
    if (next.format) setFormat(next.format);
    if (next.quality !== undefined) setQuality(next.quality);
    if (next.maxSide !== undefined) setMaxSide(String(next.maxSide));
    if (next.targetKb !== undefined) setTargetKb(next.targetKb);
    compress(items, opts);
  };

  const applyCustom = () => {
    const kb = Math.round(Number(customKb));
    if (!Number.isFinite(kb) || kb < MIN_TARGET_KB || kb > MAX_TARGET_KB) {
      setMessage(`Enter a target between ${MIN_TARGET_KB} and ${MAX_TARGET_KB} KB.`);
      return;
    }
    setMessage("");
    if (kb !== targetKb) change({ targetKb: kb });
  };

  const before = items.reduce((n, i) => n + i.file.size, 0);
  const after = items.reduce((n, i) => n + (i.result?.blob.size ?? i.file.size), 0);
  const finished = items.filter((i) => i.result);
  const saved = before > 0 ? Math.round((1 - after / before) * 100) : 0;
  const lossy = format !== "png";
  const missed = finished.filter((i) => i.result?.target && !i.result.target.reached).length;

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
      action={
        <PrimaryAction
          icon={Download}
          busy={working}
          onClick={downloadAll}
          disabled={finished.length === 0}
          hint={finished.length === 0 ? "Add images to start." : undefined}
        >
          {finished.length > 1 ? `Download ${finished.length} compressed images (.zip)` : "Download compressed image"}
        </PrimaryAction>
      }
      toolbar={
        <>
          <Segmented
            label="Mode"
            value={mode}
            onChange={(v) =>
              change({ mode: v as Mode, format: v === "target" && format === "png" ? "same" : format })
            }
            choices={modeChoices}
          />
          <Segmented
            label="Format"
            value={format}
            onChange={(v) => change({ format: v as FormatChoice })}
            choices={mode === "target" ? targetFormatChoices : formatChoices}
          />
          {mode === "target" ? (
            <>
              <SelectField
                label="Target size"
                value={custom ? "custom" : String(targetKb)}
                onChange={(event) => {
                  if (event.target.value === "custom") {
                    setCustom(true);
                    setCustomKb(String(targetKb));
                    return;
                  }
                  setCustom(false);
                  change({ targetKb: Number(event.target.value) });
                }}
                className="w-36"
              >
                {targetPresetsKb.map((kb) => (
                  <option key={kb} value={kb}>
                    Under {targetLabel(kb)}
                  </option>
                ))}
                <option value="custom">Custom…</option>
              </SelectField>
              {custom && (
                <TextField
                  label="Custom target"
                  type="number"
                  inputMode="numeric"
                  min={MIN_TARGET_KB}
                  max={MAX_TARGET_KB}
                  suffix="KB"
                  value={customKb}
                  onChange={(event) => setCustomKb(event.target.value)}
                  onBlur={applyCustom}
                  onKeyDown={(event) => event.key === "Enter" && applyCustom()}
                  className="w-32"
                />
              )}
            </>
          ) : (
            lossy && (
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
            )
          )}
          <SelectField
            label="Max size"
            value={maxSide}
            onChange={(event) => change({ maxSide: Number(event.target.value) })}
            className="w-40"
          >
            <option value="0">Keep dimensions</option>
            <option value="3840">3840 px (4K)</option>
            <option value="2560">2560 px</option>
            <option value="1920">1920 px (Full HD)</option>
            <option value="1280">1280 px</option>
            <option value="800">800 px</option>
          </SelectField>
        </>
      }
      status={
        working ? (
          <StatusMessage tone="working">Compressing…</StatusMessage>
        ) : message ? (
          <StatusMessage tone="warning">{message}</StatusMessage>
        ) : missed > 0 ? (
          <StatusMessage tone="warning">
            {missed === 1 ? "1 image" : `${missed} images`} could not get under {targetLabel(targetKb)}. Try a
            larger target or crop the image first.
          </StatusMessage>
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
                            {formatBytes(item.file.size)}
                            {r.target ? (r.kept ? " ·" : " →") : ` → ${formatBytes(r.blob.size)}`}
                          </span>{" "}
                          {r.target ? (
                            <StatusMessage tone={r.target.reached ? "success" : "warning"}>{r.target.text}</StatusMessage>
                          ) : r.kept ? (
                            <StatusMessage tone="warning">Already well compressed: original kept.</StatusMessage>
                          ) : (
                            <span className="font-semibold text-success">
                              {pct > 0 ? `−${pct}%` : `+${-pct}%`}
                            </span>
                          )}
                          {!r.target && r.size.width !== item.size?.width && ` · ${r.size.width} × ${r.size.height} px`}
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
