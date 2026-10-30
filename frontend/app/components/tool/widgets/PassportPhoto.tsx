import { useEffect, useState } from "react";
import { Download, Move, X } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { RangeField, SelectField } from "~/components/ui/Field";
import { coverCrop, mmToPx, passportPresets, sheetLayout } from "~/tools/engine/image-geometry";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { Segmented } from "../OptionControls";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, PrimaryAction, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES, useImageSource } from "./image-shared";
import { CropFrame } from "./CropFrame";

const SHEET = { width: 152.4, height: 101.6 }; // 6 × 4 in photo paper
const clamp = (n: number) => Math.min(1, Math.max(-1, n));

export function PassportPhoto() {
  const image = useImageSource();
  const [presetId, setPresetId] = useState(passportPresets[0].id);
  const [zoom, setZoom] = useState(1.4);
  const [offset, setOffset] = useState({ x: 0, y: -0.2 });
  const [output, setOutput] = useState<"single" | "sheet">("single");
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState("");

  useEffect(() => warmUpWorker(), []);

  const preset = passportPresets.find((p) => p.id === presetId)!;
  const aspect = preset.widthMm / preset.heightMm;
  const source = image.size;
  const crop = source ? coverCrop(source, aspect, zoom, offset.x, offset.y) : null;
  const layout = sheetLayout(preset, SHEET);
  const photoPx = { width: mmToPx(preset.widthMm), height: mmToPx(preset.heightMm) };

  const nudge = (dx: number, dy: number) => {
    setOffset((o) => ({ x: clamp(o.x + dx), y: clamp(o.y + dy) }));
    setDone("");
  };

  const save = async () => {
    if (!image.file || !crop) return;
    setWorking(true);
    const r = await runTaskInWorker({
      type: "image",
      job: {
        file: image.file,
        crop,
        width: photoPx.width,
        height: photoPx.height,
        mime: "image/jpeg",
        quality: 0.95,
        ...(output === "sheet" ? { sheet: layout } : {}),
      },
    });
    setWorking(false);
    if (!r.ok) {
      image.setError(r.message);
      return;
    }
    const name = `passport-${preset.id}-${output === "sheet" ? "6x4-sheet" : `${preset.widthMm}x${preset.heightMm}mm`}.jpg`;
    downloadBlob(r.value, name);
    setDone(`Saved ${name} (${formatBytes(r.value.size)}).`);
  };

  if (!image.file || !source || !crop)
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
            title="Drop a portrait photo here"
            hint="Face the camera, plain light background, even lighting. JPG, PNG or WebP."
            onFiles={([file]) => {
              image.load(file);
              setOffset({ x: 0, y: -0.2 });
              setDone("");
            }}
            onReject={image.setError}
          />
        </div>
      </Panel>
    );

  return (
    <Panel
      action={
        <PrimaryAction icon={Download} busy={working} onClick={save}>
          Download photo
        </PrimaryAction>
      }
      toolbar={
        <>
          <Segmented
            label="Output"
            value={output}
            onChange={(v) => {
              setOutput(v as "single" | "sheet");
              setDone("");
            }}
            choices={[
              { value: "single", label: "Single photo" },
              { value: "sheet", label: `6 × 4 in sheet (${layout.positions.length})` },
            ]}
          />
          <div className="ml-auto">
            <IconButton icon={X} label="Remove photo" size="sm" onClick={image.clear} />
          </div>
        </>
      }
      status={
        image.error ? (
          <StatusMessage tone="error">{image.error}</StatusMessage>
        ) : done ? (
          <StatusMessage tone="success">{done}</StatusMessage>
        ) : (
          <StatusMessage tone="idle">
            {output === "sheet"
              ? `${layout.positions.length} photos on a 6 × 4 in (152 × 102 mm) sheet at 300 DPI, with cut lines.`
              : `${photoPx.width} × ${photoPx.height} px JPG, ${preset.widthMm} × ${preset.heightMm} mm at 300 DPI.`}
          </StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(18rem,1fr)_minmax(0,1.3fr)]">
        <PanelSection title="Size and position">
          <div className="space-y-5 p-4">
            <SelectField
              label="Photo size"
              value={presetId}
              onChange={(event) => {
                setPresetId(event.target.value);
                setDone("");
              }}
            >
              {passportPresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </SelectField>
            <p className="text-sm text-fg-muted">{preset.note}</p>
            <RangeField
              label="Zoom"
              valueText={`${zoom.toFixed(1)}×`}
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(event) => {
                setZoom(Number(event.target.value));
                setDone("");
              }}
            />
            <RangeField
              label="Horizontal position"
              valueText={Math.round(offset.x * 100)}
              min={-1}
              max={1}
              step={0.01}
              value={offset.x}
              onChange={(event) => nudge(Number(event.target.value) - offset.x, 0)}
            />
            <RangeField
              label="Vertical position"
              valueText={Math.round(offset.y * 100)}
              min={-1}
              max={1}
              step={0.01}
              value={offset.y}
              onChange={(event) => nudge(0, Number(event.target.value) - offset.y)}
            />
            <p className="flex gap-2 text-xs leading-relaxed text-fg-subtle">
              <Move aria-hidden size={14} className="mt-0.5 shrink-0" />
              Drag the photo, or focus it and use the arrow keys. Line the eyes up with the upper guide and the chin
              with the lower one.
            </p>
          </div>
        </PanelSection>

        <PanelSection title="Preview">
          <div className="flex items-center justify-center bg-bg bg-dots p-6">
            <CropFrame
              url={image.url ?? ""}
              source={source}
              crop={crop}
              ratio={{ width: preset.widthMm, height: preset.heightMm }}
              offset={offset}
              onOffset={(next) => {
                setOffset(next);
                setDone("");
              }}
              label={`Passport photo preview, ${preset.label}`}
              guides="face"
            />
          </div>
          <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-fg-muted">
            Guides are approximate and do not appear in the download. This tool sizes and crops your photo; it does not
            check background, lighting or expression against official rules.
          </p>
        </PanelSection>
      </div>
    </Panel>
  );
}
