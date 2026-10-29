import type { Rect, SheetLayout } from "./image-geometry";
import { findTargetEncoding, scaledSize, type TargetResult } from "./image-target";

export type ImageMime = "image/jpeg" | "image/png" | "image/webp";

export type ImageJob = {
  file: Blob;
  /** Source crop in pixels, after EXIF rotation. Default: the whole image. */
  crop?: Rect;
  width: number;
  height: number;
  mime: ImageMime;
  /** 0–1, for JPEG and WebP. */
  quality?: number;
  /** Fill behind transparent pixels; JPEG always gets one (white by default). */
  background?: string;
  /** Repeat the rendered image on a print sheet. */
  sheet?: SheetLayout;
};

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type Context = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function makeCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context(canvas: AnyCanvas) {
  const ctx = canvas.getContext("2d") as Context | null;
  if (!ctx) throw new Error("Your browser could not create an image canvas.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return ctx;
}

function toBlob(canvas: AnyCanvas, mime: ImageMime, quality?: number): Promise<Blob> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type: mime, quality });
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The image could not be encoded."))),
      mime,
      quality,
    ),
  );
}

export async function decodeImage(file: Blob) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This file could not be opened as an image. Use JPG, PNG, WebP or GIF.");
  }
}

type Bitmap = Awaited<ReturnType<typeof decodeImage>>;

/**
 * Draws (part of) a decoded image at the given size. Large reductions are
 * done in halving steps, which keeps fine detail sharper than one big jump.
 */
function drawScaled(bitmap: Bitmap, crop: Rect, width: number, height: number, background?: string) {
  let source: CanvasImageSource = bitmap;
  let sx = crop.x;
  let sy = crop.y;
  let sw = crop.width;
  let sh = crop.height;
  while (sw / 2 >= width && sh / 2 >= height) {
    const w = Math.round(sw / 2);
    const h = Math.round(sh / 2);
    const step = makeCanvas(w, h);
    context(step).drawImage(source, sx, sy, sw, sh, 0, 0, w, h);
    source = step;
    sx = 0;
    sy = 0;
    sw = w;
    sh = h;
  }

  const canvas = makeCanvas(width, height);
  const ctx = context(canvas);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
  return canvas;
}

/** Crops, resizes and re-encodes an image. */
export async function renderImage(job: ImageJob): Promise<Blob> {
  const bitmap = await decodeImage(job.file);
  const crop = job.crop ?? { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  const background = job.background ?? (job.mime === "image/jpeg" ? "#ffffff" : undefined);
  const photo = drawScaled(bitmap, crop, job.width, job.height, background);
  bitmap.close();

  let out: AnyCanvas = photo;
  if (job.sheet) {
    out = makeCanvas(job.sheet.sheet.width, job.sheet.sheet.height);
    const sheetCtx = context(out);
    sheetCtx.fillStyle = "#ffffff";
    sheetCtx.fillRect(0, 0, out.width, out.height);
    // Thin grey cut guides around each photo.
    sheetCtx.strokeStyle = "#c8c8c8";
    sheetCtx.lineWidth = 1;
    for (const { x, y } of job.sheet.positions) {
      sheetCtx.drawImage(photo, x, y, job.sheet.photo.width, job.sheet.photo.height);
      sheetCtx.strokeRect(x - 0.5, y - 0.5, job.sheet.photo.width + 1, job.sheet.photo.height + 1);
    }
  }
  return toBlob(out, job.mime, job.quality);
}

export type TargetImageJob = {
  file: Blob;
  /** Source crop in pixels, after EXIF rotation. Default: the whole image. */
  crop?: Rect;
  /** Largest output size; the search may go smaller to reach the target. */
  width: number;
  height: number;
  /** JPEG or WebP (PNG has no quality setting to search). */
  mime: "image/jpeg" | "image/webp";
  /** Bytes the result must not exceed. */
  target: number;
  background?: string;
};

export type TargetImageResult = Omit<TargetResult, "blob"> & {
  blob: Blob;
  width: number;
  height: number;
};

/**
 * Re-encodes an image to the highest quality that fits under a byte
 * target, scaling it down only when quality alone cannot get there.
 */
export async function compressImageToTarget(job: TargetImageJob): Promise<TargetImageResult> {
  const bitmap = await decodeImage(job.file);
  const crop = job.crop ?? { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  const start = { width: job.width, height: job.height };
  const canvases = new Map<string, AnyCanvas>();
  let mime: ImageMime = job.mime;

  const canvasAt = (scale: number) => {
    const size = scaledSize(start, scale);
    const key = `${size.width}x${size.height}`;
    let canvas = canvases.get(key);
    if (!canvas) {
      canvas = drawScaled(bitmap, crop, size.width, size.height, job.background ?? "#ffffff");
      canvases.clear();
      canvases.set(key, canvas);
    }
    return canvas;
  };

  try {
    // Browsers without a WebP encoder return PNG, whose size ignores quality.
    if (mime === "image/webp") {
      const probe = await toBlob(canvasAt(1), mime, 0.5);
      if (probe.type !== mime) mime = "image/jpeg";
    }
    const result = await findTargetEncoding((scale, quality) => toBlob(canvasAt(scale), mime, quality), {
      target: job.target,
    });
    return { ...result, ...scaledSize(start, result.scale) };
  } finally {
    bitmap.close();
  }
}

export type FormImageJob = {
  file: Blob;
  crop: Rect;
  /** Exact output size the form asks for. */
  width: number;
  height: number;
  minBytes: number;
  maxBytes: number;
  /** Whiten paper and darken ink (signatures, thumb impressions). */
  clean?: boolean;
};

export type FormImageResult = {
  blob: Blob;
  quality: number;
  /** Bytes of padding added to reach the minimum size. */
  padded: number;
  /** False when even the lowest quality is above the maximum. */
  reached: boolean;
};

/**
 * Crops and resizes to a form's exact pixel size, then picks the highest
 * JPEG quality under the maximum. A result below the minimum is padded
 * with a JPEG comment, which leaves the picture unchanged.
 */
export async function fitFormImage(job: FormImageJob): Promise<FormImageResult> {
  const { cleanPaper, padJpeg } = await import("./form-photo");
  const bitmap = await decodeImage(job.file);
  const canvas = drawScaled(bitmap, job.crop, job.width, job.height, "#ffffff");
  bitmap.close();
  if (job.clean) {
    const ctx = context(canvas);
    const image = ctx.getImageData(0, 0, job.width, job.height);
    cleanPaper(image.data);
    ctx.putImageData(image, 0, 0);
  }

  const r = await findTargetEncoding((_scale, quality) => toBlob(canvas, "image/jpeg", quality), {
    target: job.maxBytes,
    maxQuality: 0.98,
    preferredQuality: 0.3,
    minQuality: 0.1,
    minScale: 1,
    qualitySteps: 7,
  });
  if (!r.reached || r.blob.size >= job.minBytes) return { blob: r.blob, quality: r.quality, padded: 0, reached: r.reached };

  const data = new Uint8Array(await r.blob.arrayBuffer());
  // Pad to just inside the range, never past the maximum.
  const goal = Math.min(job.maxBytes, job.minBytes + 512);
  const padded = padJpeg(data, goal);
  return {
    blob: new Blob([padded as BlobPart], { type: "image/jpeg" }),
    quality: r.quality,
    padded: padded.length - data.length,
    reached: true,
  };
}
