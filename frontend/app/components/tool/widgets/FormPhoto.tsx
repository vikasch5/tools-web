import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { RangeField, SelectField, TextField } from "~/components/ui/Field";
import { coverCrop, type Rect, type Size } from "~/tools/engine/image-geometry";
import {
  containRect,
  describePreset,
  formPresets,
  inkBounds,
  maxBytesFor,
  minBytesFor,
  type FormKind,
  type FormPreset,
} from "~/tools/engine/form-photo";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { Switch } from "../OptionControls";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, PrimaryAction, StatusMessage, downloadBlob } from "../Panel";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES, useImageSource } from "./image-shared";
import { CropFrame, type Offset } from "./CropFrame";
import type { WidgetProps } from "./index";

const CUSTOM = "custom";
const kb = (bytes: number) => `${(bytes / 1000).toFixed(1)} KB`;

/** Ink box of a scanned signature, measured on a small copy of the image. */
async function findInk(url: string, size: Size): Promise<Rect | null> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const scale = Math.min(1, 800 / Math.max(size.width, size.height));
  const w = Math.max(1, Math.round(size.width * scale));
  const h = Math.max(1, Math.round(size.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  const box = inkBounds(ctx.getImageData(0, 0, w, h).data, w, h);
  if (!box) return null;
  return { x: box.x / scale, y: box.y / scale, width: box.width / scale, height: box.height / scale };
}

const isInk = (kind: FormKind) => kind !== "photo";

export function FormPhoto({ preset }: WidgetProps) {
  const only = preset?.kind as FormKind | undefined;
  const choices = only ? formPresets.filter((p) => p.kind === only) : formPresets;
  const image = useImageSource();
  const [presetId, setPresetId] = useState(String(preset?.formPreset ?? choices[0].id));
  const [custom, setCustom] = useState({ width: "200", height: "230", minKb: "20", maxKb: "50" });
  const [zoom, setZoom] = useState(1.2);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: -0.2 });
  const [margin, setMargin] = useState(10);
  const [clean, setClean] = useState(true);
  const [ink, setInk] = useState<Rect | null>(null);
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState<{ text: string; tone: "success" | "warning" } | null>(null);

  useEffect(() => warmUpWorker(), []);

  const spec: FormPreset | null = useMemo(() => {
    if (presetId !== CUSTOM) return formPresets.find((p) => p.id === presetId) ?? choices[0];
    const n = (v: string) => Math.round(Number(v));
    const width = n(custom.width);
    const height = n(custom.height);
    const minKb = Math.max(0, n(custom.minKb) || 0);
    const maxKb = n(custom.maxKb);
    if (!(width >= 20 && width <= 4000 && height >= 20 && height <= 4000 && maxKb >= 2 && maxKb > minKb)) return null;
    return {
      id: CUSTOM,
      group: "",
      label: "Custom",
      kind: only ?? "photo",
      width,
      height,
      minKb: Math.max(1, minKb),
      maxKb,
      note: "",
    };
  }, [presetId, custom, only, choices]);

  const kind = spec?.kind ?? only ?? "photo";
  const source = image.size;
  const aspect = spec ? spec.width / spec.height : 1;

  // Signatures: frame the ink once per image.
  useEffect(() => {
    setInk(null);
    if (!image.url || !source || !isInk(kind)) return;
    let live = true;
    findInk(image.url, source).then((box) => live && setInk(box));
    return () => {
      live = false;
    };
  }, [image.url, source, kind]);

  const crop: Rect | null = !source
    ? null
    : isInk(kind)
      ? containRect(ink ?? { x: 0, y: 0, ...source }, aspect, margin / 100)
      : coverCrop(source, aspect, zoom, offset.x, offset.y);

  const changed = () => setDone(null);

  const save = async () => {
    if (!image.file || !crop || !spec) return;
    setWorking(true);
    const r = await runTaskInWorker({
      type: "image-form",
      job: {
        file: image.file,
        crop,
        width: spec.width,
        height: spec.height,
        minBytes: minBytesFor(spec.minKb),
        maxBytes: maxBytesFor(spec.maxKb),
        clean: isInk(kind) && clean,
      },
    });
    setWorking(false);
    if (!r.ok) return image.setError(r.message);
    const name = `${spec.id === CUSTOM ? kind : spec.id}-${spec.width}x${spec.height}.jpg`;
    const { blob, quality, padded, reached } = r.value;
    downloadBlob(blob, name);
    const range = spec.minKb > 1 ? `${spec.minKb}–${spec.maxKb} KB` : `up to ${spec.maxKb} KB`;
    setDone(
      reached
        ? {
            tone: "success",
            text: `Saved ${name}: ${spec.width} × ${spec.height} px, ${kb(blob.size)} (allowed ${range}) at ${Math.round(quality * 100)}% quality${padded ? ", padded to reach the minimum size" : ""}.`,
          }
        : {
            tone: "warning",
            text: `Saved ${name}, but it is ${kb(blob.size)}, over the ${spec.maxKb} KB limit. A simpler background or a tighter crop helps.`,
          },
    );
  };

  const presetSelect = (
    <SelectField
      label={only === "signature" ? "Form" : "Form and upload"}
      value={presetId}
      onChange={(event) => {
        setPresetId(event.target.value);
        changed();
      }}
    >
      {[...new Set(choices.map((p) => p.group))].map((group) => (
        <optgroup key={group} label={group}>
          {choices
            .filter((p) => p.group === group)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
        </optgroup>
      ))}
      <option value={CUSTOM}>Custom size…</option>
    </SelectField>
  );

  if (!image.file || !source || !crop || !image.url)
    return (
      <Panel
        status={
          image.error ? (
            <StatusMessage tone="error">{image.error}</StatusMessage>
          ) : (
            <StatusMessage tone="idle">Your photo stays on your device.</StatusMessage>
          )
        }
      >
        <div className="p-4 sm:p-6">
          <FileDrop
            accept={IMAGE_ACCEPT}
            maxBytes={MAX_IMAGE_BYTES}
            title={only === "signature" ? "Drop a photo or scan of your signature" : "Drop your photo, signature or scan"}
            hint={
              only === "signature"
                ? "Sign on plain white paper with a black pen, then take a photo in good light. JPG, PNG or WebP."
                : "A phone photo is fine. JPG, PNG or WebP."
            }
            onFiles={([file]) => {
              image.load(file);
              setOffset({ x: 0, y: -0.2 });
              changed();
            }}
            onReject={image.setError}
          />
        </div>
      </Panel>
    );

  return (
    <Panel
      action={
        <PrimaryAction
          icon={Download}
          busy={working}
          onClick={save}
          disabled={!spec}
          hint={!spec ? "Enter a valid custom size first." : undefined}
        >
          Download {spec ? `${spec.width} × ${spec.height} px` : ""} JPG
        </PrimaryAction>
      }
      toolbar={
        <div className="ml-auto">
          <IconButton icon={X} label="Remove image" size="sm" onClick={image.clear} />
        </div>
      }
      status={
        image.error ? (
          <StatusMessage tone="error">{image.error}</StatusMessage>
        ) : done ? (
          <StatusMessage tone={done.tone}>{done.text}</StatusMessage>
        ) : spec ? (
          <StatusMessage tone="idle">Output: {describePreset(spec)}.</StatusMessage>
        ) : (
          <StatusMessage tone="warning">Custom size: 20–4000 px each side, and a maximum above the minimum.</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(18rem,1fr)_minmax(0,1.3fr)]">
        <PanelSection title="Form and crop">
          <div className="space-y-5 p-4">
            {presetSelect}
            {presetId === CUSTOM ? (
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["width", "Width", "px"],
                    ["height", "Height", "px"],
                    ["minKb", "Minimum", "KB"],
                    ["maxKb", "Maximum", "KB"],
                  ] as const
                ).map(([key, label, unit]) => (
                  <TextField
                    key={key}
                    label={label}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    suffix={unit}
                    value={custom[key]}
                    onChange={(event) => {
                      setCustom((c) => ({ ...c, [key]: event.target.value }));
                      changed();
                    }}
                  />
                ))}
              </div>
            ) : (
              spec && <p className="text-sm text-fg-muted">{spec.note}</p>
            )}

            {isInk(kind) ? (
              <>
                <RangeField
                  label="Margin around the ink"
                  valueText={`${margin}%`}
                  min={0}
                  max={40}
                  step={2}
                  value={margin}
                  onChange={(event) => {
                    setMargin(Number(event.target.value));
                    changed();
                  }}
                />
                <Switch
                  label="Clean up the paper (white background, darker ink)"
                  checked={clean}
                  onChange={(next) => {
                    setClean(next);
                    changed();
                  }}
                />
                <p className="text-xs leading-relaxed text-fg-subtle">
                  {ink
                    ? "The crop is fitted around the ink automatically."
                    : "No clear ink found, so the whole image is used. A darker pen or better light helps."}
                </p>
              </>
            ) : (
              <>
                <RangeField
                  label="Zoom"
                  valueText={`${zoom.toFixed(1)}×`}
                  min={1}
                  max={4}
                  step={0.05}
                  value={zoom}
                  onChange={(event) => {
                    setZoom(Number(event.target.value));
                    changed();
                  }}
                />
                <p className="text-xs leading-relaxed text-fg-subtle">
                  Drag the photo, or focus it and use the arrow keys, so the face sits inside the oval.
                </p>
              </>
            )}
          </div>
        </PanelSection>

        <PanelSection title="Preview">
          <div className="flex items-center justify-center bg-bg bg-dots p-6">
            <CropFrame
              url={image.url}
              source={source}
              crop={crop}
              ratio={{ width: spec?.width ?? 1, height: spec?.height ?? 1 }}
              offset={offset}
              onOffset={(next) => {
                if (isInk(kind)) return;
                setOffset(next);
                changed();
              }}
              label={`Preview of the ${spec ? describePreset(spec) : "custom"} upload`}
              guides={kind === "photo" ? "face" : "none"}
              // Close to the clean-up done on download: grey paper turns white.
              filter={isInk(kind) && clean ? "grayscale(1) brightness(1.35) contrast(2.4)" : undefined}
              className={aspect > 1.2 ? "max-w-md" : "max-w-64"}
            />
          </div>
          <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-fg-muted">
            Specs change with each notification. Check the size and KB limits in your own form before uploading.
          </p>
        </PanelSection>
      </div>
    </Panel>
  );
}
