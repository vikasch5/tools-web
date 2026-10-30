import { useEffect, useRef, useState } from "react";
import { CalendarDays, Download, Plus, Trash2, X } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { RangeField, SelectField, TextAreaField } from "~/components/ui/Field";
import { Segmented, Switch } from "../OptionControls";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, PrimaryAction, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { fontPixels } from "~/tools/engine/text-layer";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES, mimeFor, outputName, useImageSource, type FormatChoice } from "./image-shared";

type Layer = {
  id: number;
  text: string;
  /** Centre of the text, as a fraction of the image (0–1). */
  x: number;
  y: number;
  /** Font size as a share of the image's shorter side, %. */
  size: number;
  color: string;
  font: string;
  bold: boolean;
  outline: boolean;
};

const fonts = [
  { value: "sans", label: "Sans", css: "system-ui, 'Segoe UI', Roboto, 'Noto Sans', 'Noto Sans Devanagari', sans-serif" },
  { value: "display", label: "Display", css: "'Bricolage Grotesque Variable', system-ui, sans-serif" },
  { value: "serif", label: "Serif", css: "Georgia, 'Times New Roman', 'Noto Serif', 'Noto Serif Devanagari', serif" },
  { value: "mono", label: "Mono", css: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace" },
  { value: "hand", label: "Handwriting", css: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive" },
];

const fontCss = (layer: Layer, px: number) =>
  `${layer.bold ? 700 : 400} ${px}px ${fonts.find((f) => f.value === layer.font)!.css}`;

function today() {
  return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Draws every layer on a canvas whose shorter side is `short` pixels. Returns each layer's box. */
function drawLayers(ctx: CanvasRenderingContext2D, layers: Layer[], width: number, height: number) {
  const boxes = new Map<number, { x: number; y: number; w: number; h: number }>();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const layer of layers) {
    const px = fontPixels(layer.size, width, height);
    ctx.font = fontCss(layer, px);
    const lines = layer.text.split("\n");
    const lineHeight = px * 1.2;
    const cx = layer.x * width;
    const top = layer.y * height - ((lines.length - 1) * lineHeight) / 2;
    let w = 0;
    lines.forEach((line, i) => {
      const y = top + i * lineHeight;
      w = Math.max(w, ctx.measureText(line).width);
      if (layer.outline) {
        ctx.lineJoin = "round";
        ctx.lineWidth = Math.max(2, px / 8);
        ctx.strokeStyle = isLight(layer.color) ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)";
        ctx.strokeText(line, cx, y);
      }
      ctx.fillStyle = layer.color;
      ctx.fillText(line, cx, y);
    });
    const h = lines.length * lineHeight;
    boxes.set(layer.id, { x: cx - w / 2, y: layer.y * height - h / 2, w, h });
  }
  return boxes;
}

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

export function AddText() {
  const image = useImageSource();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [format, setFormat] = useState<FormatChoice>("same");
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const boxes = useRef(new Map<number, { x: number; y: number; w: number; h: number }>());
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const nextId = useRef(1);

  const layer = layers.find((l) => l.id === selected) ?? null;

  const addLayer = (text: string, patch: Partial<Layer> = {}) => {
    const id = nextId.current++;
    setLayers((list) => [
      ...list,
      { id, text, x: 0.5, y: list.length ? Math.min(0.9, 0.2 + list.length * 0.15) : 0.85, size: 7, color: "#ffffff", font: "sans", bold: true, outline: true, ...patch },
    ]);
    setSelected(id);
    setDone("");
  };
  const change = (patch: Partial<Layer>) => {
    if (selected === null) return;
    setLayers((list) => list.map((l) => (l.id === selected ? { ...l, ...patch } : l)));
    setDone("");
  };

  // Load the photo for drawing, and start with one text layer.
  useEffect(() => {
    if (!image.url) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setLayers([]);
      nextId.current = 1;
      addLayer("Your text here");
    };
    img.src = image.url;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.url]);

  // Redraw the preview.
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const scale = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    boxes.current = drawLayers(ctx, layers, canvas.width, canvas.height);
    const box = selected !== null ? boxes.current.get(selected) : undefined;
    if (box) {
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.strokeRect(box.x - 6, box.y - 4, box.w + 12, box.h + 8);
    }
  }, [layers, selected, image.url]);

  if (!image.file || !image.url)
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
          <FileDrop accept={IMAGE_ACCEPT} maxBytes={MAX_IMAGE_BYTES} title="Drop a photo to add text to" hint="JPG, PNG or WebP, up to 25 MB." onFiles={([f]) => image.load(f)} onReject={image.setError} />
        </div>
      </Panel>
    );

  /** Canvas pixel under a pointer event. */
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const r = canvas.getBoundingClientRect();
    return { x: ((event.clientX - r.left) / r.width) * canvas.width, y: ((event.clientY - r.top) / r.height) * canvas.height };
  };

  const save = async () => {
    const img = imgRef.current;
    if (!img || !image.file) return;
    setWorking(true);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    const mime = mimeFor(image.file, format);
    if (mime === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    drawLayers(ctx, layers, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, mime, 0.92));
    setWorking(false);
    if (!blob) return image.setError("The image could not be saved.");
    const name = outputName(image.file, blob.type, "text");
    downloadBlob(blob, name);
    setDone(`Saved ${name} (${canvas.width} × ${canvas.height} px, ${formatBytes(blob.size)}).`);
  };

  return (
    <Panel
      action={
        <PrimaryAction icon={Download} busy={working} onClick={save} disabled={!layers.some((l) => l.text.trim())} hint={layers.some((l) => l.text.trim()) ? undefined : "Type some text first."}>
          Download photo with text
        </PrimaryAction>
      }
      toolbar={
        <>
          <Segmented
            label="Format"
            value={format}
            onChange={(v) => setFormat(v as FormatChoice)}
            choices={[
              { value: "same", label: "Same" },
              { value: "jpeg", label: "JPG" },
              { value: "png", label: "PNG" },
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
          <StatusMessage tone="idle">Drag text on the photo to place it. Click a text to edit it.</StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(17rem,1fr)_minmax(0,2fr)]">
        <PanelSection
          title="Text"
          actions={
            <>
              <Button variant="ghost" size="sm" icon={Plus} onClick={() => addLayer("New text")}>
                Add
              </Button>
              <Button variant="ghost" size="sm" icon={CalendarDays} onClick={() => addLayer(today(), { y: 0.93, x: 0.82, size: 4, bold: false })}>
                Date
              </Button>
            </>
          }
        >
          <div className="space-y-4 p-4">
            {layers.length > 1 && (
              <SelectField label="Editing" value={selected ?? ""} onChange={(e) => setSelected(Number(e.target.value))}>
                {layers.map((l, i) => (
                  <option key={l.id} value={l.id}>
                    {i + 1}. {l.text.split("\n")[0].slice(0, 30) || "(empty)"}
                  </option>
                ))}
              </SelectField>
            )}
            {layer ? (
              <>
                <TextAreaField label="Text" rows={3} value={layer.text} onChange={(e) => change({ text: e.target.value })} />
                <SelectField label="Font" value={layer.font} onChange={(e) => change({ font: e.target.value })}>
                  {fonts.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </SelectField>
                <RangeField label="Size" valueText={`${layer.size}%`} min={2} max={25} step={0.5} value={layer.size} onChange={(e) => change({ size: Number(e.target.value) })} />
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-fg-muted">
                    Colour
                    <input type="color" value={layer.color} onChange={(e) => change({ color: e.target.value })} className="size-8 cursor-pointer rounded-md border border-border bg-bg" />
                  </label>
                  <Switch label="Bold" checked={layer.bold} onChange={(bold) => change({ bold })} />
                  <Switch label="Outline" checked={layer.outline} onChange={(outline) => change({ outline })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <RangeField label="Left – right" valueText={`${Math.round(layer.x * 100)}`} min={0} max={1} step={0.01} value={layer.x} onChange={(e) => change({ x: Number(e.target.value) })} />
                  <RangeField label="Top – bottom" valueText={`${Math.round(layer.y * 100)}`} min={0} max={1} step={0.01} value={layer.y} onChange={(e) => change({ y: Number(e.target.value) })} />
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => {
                    setLayers((list) => list.filter((l) => l.id !== layer.id));
                    setSelected(layers.find((l) => l.id !== layer.id)?.id ?? null);
                  }}
                >
                  Remove this text
                </Button>
              </>
            ) : (
              <p className="text-sm text-fg-muted">Add a text to start.</p>
            )}
          </div>
        </PanelSection>
        <PanelSection title="Preview">
          <div className="flex items-center justify-center bg-bg bg-dots p-4 sm:p-6">
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`Photo with ${layers.length} text ${layers.length === 1 ? "layer" : "layers"}: ${layers.map((l) => l.text).join("; ")}`}
              className="h-auto max-h-[70vh] w-auto max-w-full cursor-grab touch-none shadow-lg ring-1 ring-border active:cursor-grabbing"
              onPointerDown={(event) => {
                const p = point(event);
                // Topmost layer under the pointer.
                const hit = [...layers].reverse().find((l) => {
                  const b = boxes.current.get(l.id);
                  return b && p.x >= b.x - 10 && p.x <= b.x + b.w + 10 && p.y >= b.y - 10 && p.y <= b.y + b.h + 10;
                });
                if (!hit) return;
                setSelected(hit.id);
                event.currentTarget.setPointerCapture(event.pointerId);
                const c = event.currentTarget;
                drag.current = { id: hit.id, dx: p.x - hit.x * c.width, dy: p.y - hit.y * c.height };
              }}
              onPointerMove={(event) => {
                const d = drag.current;
                if (!d) return;
                const p = point(event);
                const c = event.currentTarget;
                const x = Math.min(1, Math.max(0, (p.x - d.dx) / c.width));
                const y = Math.min(1, Math.max(0, (p.y - d.dy) / c.height));
                setLayers((list) => list.map((l) => (l.id === d.id ? { ...l, x, y } : l)));
                setDone("");
              }}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
            />
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
