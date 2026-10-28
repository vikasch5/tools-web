import { useEffect, useState } from "react";
import { Download, RefreshCw, Scaling, X } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { RangeField, TextField } from "~/components/ui/Field";
import { resizeDimensions } from "~/tools/engine/image-geometry";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { Segmented, Switch } from "../OptionControls";
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

type Result = { blob: Blob; url: string; name: string; width: number; height: number; note: string | null };

export function ResizeImage() {
  const image = useImageSource();
  const [mode, setMode] = useState<"pixels" | "percent">("pixels");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [keepRatio, setKeepRatio] = useState(true);
  const [percent, setPercent] = useState(50);
  const [format, setFormat] = useState<FormatChoice>("same");
  const [quality, setQuality] = useState(90);
  const [result, setResult] = useState<Result | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => warmUpWorker(), []);
  useEffect(() => () => void (result && URL.revokeObjectURL(result.url)), [result]);
  useEffect(() => {
    if (!image.size) return;
    setWidth(String(image.size.width));
    setHeight(String(image.size.height));
    setResult(null);
  }, [image.size]);

  const source = image.size;
  const target = source
    ? resizeDimensions(
        source,
        mode === "percent"
          ? { mode, percent }
          : { mode, width: Number(width), height: Number(height), keepRatio },
      )
    : null;
  const ratio = source ? source.width / source.height : 1;
  const mime = image.file ? mimeFor(image.file, format) : "image/jpeg";
  const lossy = mime !== "image/png";

  const resize = async () => {
    if (!image.file || !target) return;
    setWorking(true);
    const r = await runTaskInWorker({
      type: "image",
      job: { file: image.file, width: target.width, height: target.height, mime, quality: quality / 100 },
    });
    setWorking(false);
    if (!r.ok) {
      image.setError(r.message);
      return;
    }
    setResult({
      blob: r.value,
      url: URL.createObjectURL(r.value),
      name: outputName(image.file, r.value.type, `${target.width}x${target.height}`),
      width: target.width,
      height: target.height,
      note: encoderNote(mime, r.value.type),
    });
  };

  if (!image.file || !source)
    return (
      <Panel
        status={
          image.error ? (
            <StatusMessage tone="error">{image.error}</StatusMessage>
          ) : (
            <StatusMessage tone="idle">Images stay on your device.</StatusMessage>
          )
        }
      >
        <div className="p-4 sm:p-6">
          <FileDrop
            accept={IMAGE_ACCEPT}
            maxBytes={MAX_IMAGE_BYTES}
            title="Drop an image here"
            hint="JPG, PNG or WebP, up to 25 MB."
            onFiles={([file]) => image.load(file)}
            onReject={image.setError}
          />
        </div>
      </Panel>
    );

  return (
    <Panel
      action={
        result ? (
          <PrimaryAction icon={Download} onClick={() => downloadBlob(result.blob, result.name)}>
            Download resized image ({result.width} × {result.height} px)
          </PrimaryAction>
        ) : (
          <PrimaryAction icon={Scaling} busy={working} onClick={resize} disabled={!target}>
            Resize image
          </PrimaryAction>
        )
      }
      toolbar={
        <>
          <Segmented
            label="Size by"
            value={mode}
            onChange={(v) => setMode(v as "pixels" | "percent")}
            choices={[
              { value: "pixels", label: "Pixels" },
              { value: "percent", label: "Percentage" },
            ]}
          />
          <Segmented label="Format" value={format} onChange={(v) => setFormat(v as FormatChoice)} choices={formatChoices} />
          <div className="ml-auto">
            <IconButton icon={X} label="Remove image" size="sm" onClick={() => { image.clear(); setResult(null); }} />
          </div>
        </>
      }
      status={
        image.error ? (
          <StatusMessage tone="error">{image.error}</StatusMessage>
        ) : working ? (
          <StatusMessage tone="working">Resizing…</StatusMessage>
        ) : result ? (
          <StatusMessage tone={result.note ? "warning" : "success"}>
            Resized to {result.width} × {result.height} px · {formatBytes(result.blob.size)}
            {result.note && `. ${result.note}`}
          </StatusMessage>
        ) : (
          <StatusMessage tone="idle">
            {image.file.name} · {source.width} × {source.height} px · {formatBytes(image.file.size)}
          </StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(18rem,1fr)_minmax(0,1.4fr)]">
        <PanelSection title="New size">
          <div className="space-y-5 p-4">
            {mode === "pixels" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="Width"
                    suffix="px"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={16384}
                    value={width}
                    onChange={(event) => {
                      setWidth(event.target.value);
                      if (keepRatio && Number(event.target.value) > 0)
                        setHeight(String(Math.max(1, Math.round(Number(event.target.value) / ratio))));
                    }}
                  />
                  <TextField
                    label="Height"
                    suffix="px"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={16384}
                    value={height}
                    onChange={(event) => {
                      setHeight(event.target.value);
                      if (keepRatio && Number(event.target.value) > 0)
                        setWidth(String(Math.max(1, Math.round(Number(event.target.value) * ratio))));
                    }}
                  />
                </div>
                <Switch label="Keep aspect ratio" checked={keepRatio} onChange={setKeepRatio} />
              </>
            ) : (
              <RangeField
                label="Scale"
                valueText={`${percent}%`}
                min={5}
                max={200}
                step={5}
                value={percent}
                onChange={(event) => setPercent(Number(event.target.value))}
              />
            )}
            {lossy && (
              <RangeField
                label="Quality"
                valueText={`${quality}%`}
                min={40}
                max={100}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
              />
            )}
            {target && (
              <p className="rounded-md bg-bg p-3 text-sm text-fg-muted ring-1 ring-border">
                {source.width} × {source.height} px →{" "}
                <strong className="font-semibold text-fg">
                  {target.width} × {target.height} px
                </strong>
                {target.width > source.width && " (enlarging can look soft)"}
              </p>
            )}
          </div>
        </PanelSection>

        <PanelSection
          title={result ? "Result" : "Original"}
          actions={
            result && (
              <>
                <IconButton icon={RefreshCw} label="Show original" size="sm" onClick={() => setResult(null)} />
              </>
            )
          }
        >
          <div className="flex min-h-72 items-center justify-center bg-bg bg-dots p-4">
            <img
              src={result?.url ?? image.url ?? undefined}
              alt={result ? `Resized image, ${result.width} by ${result.height} pixels` : `Original: ${image.file.name}`}
              className="max-h-[60vh] max-w-full rounded-sm object-contain shadow-md"
            />
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
