import type { Rect, SheetLayout } from "./image-geometry";

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

/**
 * Crops, resizes and re-encodes an image. Large reductions are done in
 * halving steps, which keeps fine detail sharper than one big jump.
 */
export async function renderImage(job: ImageJob): Promise<Blob> {
  const bitmap = await decodeImage(job.file);
  const crop = job.crop ?? { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  let source: CanvasImageSource = bitmap;
  let sx = crop.x;
  let sy = crop.y;
  let sw = crop.width;
  let sh = crop.height;
  while (sw / 2 >= job.width && sh / 2 >= job.height) {
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

  const photo = makeCanvas(job.width, job.height);
  const ctx = context(photo);
  const background = job.background ?? (job.mime === "image/jpeg" ? "#ffffff" : undefined);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, job.width, job.height);
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, job.width, job.height);
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
