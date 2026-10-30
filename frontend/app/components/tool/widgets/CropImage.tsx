import { useEffect, useRef, useState } from "react";
import { Download, FlipHorizontal2, RotateCcw, RotateCw, X } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { TextField } from "~/components/ui/Field";
import type { Rect, Size } from "~/tools/engine/image-geometry";
import { aspectChoices, centredRect, clampRect, dragRect, turnedSize, type Handle } from "~/tools/engine/crop-geometry";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
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
  useImageSource,
  type FormatChoice,
} from "./image-shared";

const handles: { id: Handle; className: string; label: string }[] = [
  { id: "nw", className: "-top-1.5 -left-1.5 cursor-nwse-resize", label: "top-left corner" },
  { id: "n", className: "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize", label: "top edge" },
  { id: "ne", className: "-top-1.5 -right-1.5 cursor-nesw-resize", label: "top-right corner" },
  { id: "e", className: "top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize", label: "right edge" },
  { id: "se", className: "-right-1.5 -bottom-1.5 cursor-nwse-resize", label: "bottom-right corner" },
  { id: "s", className: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize", label: "bottom edge" },
  { id: "sw", className: "-bottom-1.5 -left-1.5 cursor-nesw-resize", label: "bottom-left corner" },
  { id: "w", className: "top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize", label: "left edge" },
];

/** A preview of the image turned and mirrored, as an object URL. */
function useOrientedPreview(url: string | null, turn: number, flip: boolean) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return setPreview(null);
    if (!turn && !flip) return setPreview(url);
    let live = true;
    let made: string | null = null;
    (async () => {
      const img = new Image();
      img.src = url;
      await img.decode();
      // A small copy is enough for the screen.
      const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const sideways = turn % 2 === 1;
      const canvas = document.createElement("canvas");
      canvas.width = sideways ? h : w;
      canvas.height = sideways ? w : h;
      const ctx = canvas.getContext("2d")!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (flip) ctx.scale(-1, 1);
      ctx.rotate((turn * Math.PI) / 2);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
      if (!live || !blob) return;
      made = URL.createObjectURL(blob);
      setPreview(made);
    })();
    return () => {
      live = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [url, turn, flip]);
  return preview;
}

export function CropImage() {
  const image = useImageSource();
  const [turn, setTurn] = useState(0);
  const [flip, setFlip] = useState(false);
  const [aspect, setAspect] = useState("free");
  const [rect, setRect] = useState<Rect | null>(null);
  const [format, setFormat] = useState<FormatChoice>("same");
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState("");
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ handle: Handle; x: number; y: number; start: Rect } | null>(null);

  useEffect(() => warmUpWorker(), []);
  const preview = useOrientedPreview(image.url, turn, flip);
  const bounds: Size | null = image.size ? turnedSize(image.size, turn) : null;
  const ratio = aspectChoices.find((a) => a.value === aspect)!.ratio;

  // A fresh crop for each image, turn or ratio.
  useEffect(() => {
    if (bounds) setRect(centredRect(bounds, ratio, ratio ? 1 : 0.8));
    setDone("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.size, turn, ratio]);

  if (!image.file || !bounds || !rect || !preview)
    return (
      <Panel
        status={
          image.error ? (
            <StatusMessage tone="error">{image.error}</StatusMessage>
          ) : (
            <StatusMessage tone="idle">Your image stays on your device.</StatusMessage>
          )
        }
      >
        <div className="p-4 sm:p-6">
          <FileDrop
            accept={IMAGE_ACCEPT}
            maxBytes={MAX_IMAGE_BYTES}
            title="Drop an image to crop"
            hint="JPG, PNG or WebP, up to 25 MB."
            onFiles={([file]) => {
              setTurn(0);
              setFlip(false);
              image.load(file);
            }}
            onReject={image.setError}
          />
        </div>
      </Panel>
    );

  /** Image pixels per screen pixel. */
  const scale = () => bounds.width / (frameRef.current?.clientWidth || bounds.width);
  const update = (next: Rect) => {
    setRect(next);
    setDone("");
  };
  const setField = (key: keyof Rect, value: number) => {
    if (!Number.isFinite(value)) return;
    let next = { ...rect, [key]: value };
    if (ratio && key === "width") next.height = value / ratio;
    if (ratio && key === "height") next.width = value * ratio;
    update(clampRect(next, bounds));
  };

  const mime = mimeFor(image.file, format);
  const save = async () => {
    setWorking(true);
    const r = await runTaskInWorker({
      type: "image",
      job: { file: image.file!, crop: rect, width: rect.width, height: rect.height, mime, quality: 0.92, turn, flip },
    });
    setWorking(false);
    if (!r.ok) return image.setError(r.message);
    const name = outputName(image.file!, r.value.type, "cropped");
    downloadBlob(r.value, name);
    setDone(`Saved ${name}: ${rect.width} × ${rect.height} px, ${formatBytes(r.value.size)}.${encoderNote(mime, r.value.type) ? ` ${encoderNote(mime, r.value.type)}` : ""}`);
  };

  const pct = (n: number, of: number) => `${(n / of) * 100}%`;

  return (
    <Panel
      action={
        <PrimaryAction icon={Download} busy={working} onClick={save}>
          Download cropped image ({rect.width} × {rect.height} px)
        </PrimaryAction>
      }
      toolbar={
        <>
          <Segmented label="Format" value={format} onChange={(v) => setFormat(v as FormatChoice)} choices={formatChoices} />
          <div className="flex items-center gap-1">
            <IconButton icon={RotateCcw} label="Rotate left" size="sm" onClick={() => setTurn((t) => (t + 3) % 4)} />
            <IconButton icon={RotateCw} label="Rotate right" size="sm" onClick={() => setTurn((t) => (t + 1) % 4)} />
            <IconButton icon={FlipHorizontal2} label={flip ? "Undo mirror" : "Mirror"} size="sm" onClick={() => setFlip((f) => !f)} />
          </div>
          <div className="ml-auto">
            <IconButton icon={X} label="Remove image" size="sm" onClick={image.clear} />
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
            Drag the box or its handles. With the box focused, arrow keys move it and Shift + arrows resize it.
          </StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(16rem,1fr)_minmax(0,2fr)]">
        <PanelSection title="Crop">
          <div className="space-y-4 p-4">
            <fieldset className="space-y-2">
              <legend className="text-[0.8125rem] font-medium text-fg-muted">Aspect ratio</legend>
              <div className="flex flex-wrap gap-2">
                {aspectChoices.map((a) => (
                  <label
                    key={a.value}
                    className="inline-flex h-8 cursor-pointer items-center rounded-md border border-border bg-bg px-3 text-sm font-medium text-fg-muted has-checked:border-fg has-checked:bg-surface has-checked:text-fg has-focus-visible:outline-2 has-focus-visible:outline-ring pointer-coarse:h-11"
                  >
                    <input type="radio" name="crop-aspect" value={a.value} checked={aspect === a.value} onChange={() => setAspect(a.value)} className="sr-only" />
                    {a.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Width" suffix="px" type="number" inputMode="numeric" value={rect.width} onChange={(e) => setField("width", Number(e.target.value))} />
              <TextField label="Height" suffix="px" type="number" inputMode="numeric" value={rect.height} onChange={(e) => setField("height", Number(e.target.value))} />
              <TextField label="Left" suffix="px" type="number" inputMode="numeric" value={rect.x} onChange={(e) => setField("x", Number(e.target.value))} />
              <TextField label="Top" suffix="px" type="number" inputMode="numeric" value={rect.y} onChange={(e) => setField("y", Number(e.target.value))} />
            </div>
            <p className="text-xs text-fg-subtle">
              Image: {bounds.width} × {bounds.height} px{turn ? `, turned ${turn * 90}°` : ""}
              {flip ? ", mirrored" : ""}.
            </p>
          </div>
        </PanelSection>
        <PanelSection title="Preview">
          <div className="flex items-center justify-center bg-bg bg-dots p-4 sm:p-6">
            <div ref={frameRef} className="relative w-full max-w-2xl touch-none select-none" style={{ aspectRatio: `${bounds.width} / ${bounds.height}` }}>
              <img src={preview} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full" />
              {/* Dims the area outside the crop, clipped to the image. */}
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className="absolute shadow-[0_0_0_9999px_rgb(0_0_0/0.5)]"
                  style={{
                    left: pct(rect.x, bounds.width),
                    top: pct(rect.y, bounds.height),
                    width: pct(rect.width, bounds.width),
                    height: pct(rect.height, bounds.height),
                  }}
                />
              </div>
              <div
                role="group"
                tabIndex={0}
                aria-label={`Crop box, ${rect.width} by ${rect.height} pixels at ${rect.x}, ${rect.y}`}
                className="absolute cursor-move outline-2 outline-white focus-visible:outline-ring"
                style={{
                  left: pct(rect.x, bounds.width),
                  top: pct(rect.y, bounds.height),
                  width: pct(rect.width, bounds.width),
                  height: pct(rect.height, bounds.height),
                }}
                onPointerDown={(event) => {
                  const handle = ((event.target as HTMLElement).dataset.handle as Handle | undefined) ?? "move";
                  event.currentTarget.setPointerCapture(event.pointerId);
                  drag.current = { handle, x: event.clientX, y: event.clientY, start: rect };
                }}
                onPointerMove={(event) => {
                  const d = drag.current;
                  if (!d) return;
                  const k = scale();
                  update(dragRect(d.start, d.handle, (event.clientX - d.x) * k, (event.clientY - d.y) * k, bounds, ratio));
                }}
                onPointerUp={() => (drag.current = null)}
                onPointerCancel={() => (drag.current = null)}
                onKeyDown={(event) => {
                  const step = Math.max(1, Math.round(Math.max(bounds.width, bounds.height) / 100));
                  const moves: Record<string, [number, number]> = {
                    ArrowLeft: [-step, 0],
                    ArrowRight: [step, 0],
                    ArrowUp: [0, -step],
                    ArrowDown: [0, step],
                  };
                  const move = moves[event.key];
                  if (!move) return;
                  event.preventDefault();
                  update(dragRect(rect, event.shiftKey ? "se" : "move", move[0], move[1], bounds, ratio));
                }}
              >
                {/* Rule-of-thirds guides. */}
                <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }, (_, i) => (
                    <div key={i} className="border-[0.5px] border-white/40" />
                  ))}
                </div>
                {handles.map((h) => (
                  <span
                    key={h.id}
                    data-handle={h.id}
                    aria-hidden
                    title={`Drag the ${h.label}`}
                    className={`absolute size-3 rounded-sm border border-fg bg-white pointer-coarse:size-5 ${h.className}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
