import type { PDFDict, PDFRawStream } from "pdf-lib";
import { loadPdf, pdfBaseName, type PdfFile } from "./pdf";
import { optimizePdf } from "./qpdf";

export type CompressLevel = "low" | "medium" | "high";

/**
 * low: lossless only. medium and high also re-encode photos and scans as
 * JPEG, scaling down any image whose long edge is over `maxEdge` pixels.
 */
export const compressLevels: Record<CompressLevel, { label: string; maxEdge: number; quality: number } | null> = {
  low: null,
  medium: { label: "Recommended", maxEdge: 2000, quality: 72 },
  high: { label: "Strong", maxEdge: 1400, quality: 50 },
};

export function describeLevel(level: CompressLevel) {
  const s = compressLevels[level];
  if (!s) return "Lossless: streams recompressed and objects packed; images untouched";
  return `${s.label}: images over ${s.maxEdge} px scaled down, JPEG quality ${s.quality}%`;
}

/** Output size as a percentage change, e.g. "-38%". */
export function sizeChange(before: number, after: number) {
  if (!before) return "0%";
  const change = Math.round(((after - before) / before) * 100);
  return `${change > 0 ? "+" : change < 0 ? "−" : ""}${Math.abs(change)}%`;
}

type ImageStats = { images: number; reencoded: number };

/**
 * Re-encodes the JPEG images in a PDF smaller, using the browser's image
 * decoder. Skips CMYK, masked and unusual images, and keeps the original
 * whenever the new one is not at least 10% smaller.
 */
async function recompressJpegs(data: Uint8Array, name: string, maxEdge: number, quality: number) {
  const lib = await import("pdf-lib");
  const { PDFName, PDFNumber, PDFRawStream, PDFArray, PDFBool } = lib;
  const doc = await loadPdf({ name, data });
  const context = doc.context;
  const stats: ImageStats = { images: 0, reencoded: 0 };
  const canDecode = typeof createImageBitmap !== "undefined" && typeof OffscreenCanvas !== "undefined";

  const nameOf = (dict: PDFDict, key: string) => {
    const value = dict.lookup(PDFName.of(key));
    if (value instanceof PDFName) return value.asString();
    if (value instanceof PDFArray && value.size() === 1) {
      const first = value.lookup(0);
      return first instanceof PDFName ? first.asString() : undefined;
    }
    return value === undefined ? undefined : "other";
  };
  const colourComponents = (dict: PDFDict) => {
    const cs = dict.lookup(PDFName.of("ColorSpace"));
    if (cs instanceof PDFName) return { "/DeviceRGB": 3, "/DeviceGray": 1, "/DeviceCMYK": 4 }[cs.asString()] ?? 0;
    const family = cs instanceof PDFArray ? cs.lookup(0) : undefined;
    if (cs instanceof PDFArray && family instanceof PDFName && family.asString() === "/ICCBased") {
      const profile = cs.lookup(1);
      const n = profile && "dict" in profile ? (profile as PDFRawStream).dict.lookup(PDFName.of("N")) : undefined;
      return n instanceof PDFNumber ? n.asNumber() : 0;
    }
    return 0;
  };

  for (const [ref, object] of context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream)) continue;
    const dict = object.dict;
    if (nameOf(dict, "Subtype") !== "/Image") continue;
    stats.images++;
    if (!canDecode || nameOf(dict, "Filter") !== "/DCTDecode") continue;
    const components = colourComponents(dict);
    const imageMask = dict.lookup(PDFName.of("ImageMask"));
    if (
      (components !== 1 && components !== 3) ||
      dict.has(PDFName.of("Decode")) ||
      dict.lookup(PDFName.of("Mask")) instanceof PDFArray ||
      (imageMask instanceof PDFBool && imageMask.asBoolean())
    )
      continue;

    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(new Blob([object.contents as Uint8Array<ArrayBuffer>], { type: "image/jpeg" }));
    } catch {
      continue;
    }
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      continue;
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const encoded = new Uint8Array(await (await canvas.convertToBlob({ type: "image/jpeg", quality: quality / 100 })).arrayBuffer());
    if (encoded.length > object.contents.length * 0.9) continue;

    const next = dict.clone(context);
    next.delete(PDFName.of("DecodeParms"));
    next.delete(PDFName.of("Length"));
    next.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
    next.set(PDFName.of("Width"), PDFNumber.of(width));
    next.set(PDFName.of("Height"), PDFNumber.of(height));
    next.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
    // The canvas always writes colour JPEGs.
    next.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
    context.assign(ref, PDFRawStream.of(next, encoded));
    stats.reencoded++;
  }
  return { data: stats.reencoded ? await doc.save({ useObjectStreams: false }) : data, stats };
}

type Settings = { maxEdge: number; quality: number } | null;

async function compressWith(file: PdfFile, settings: Settings) {
  let data = file.data;
  let stats: ImageStats = { images: 0, reencoded: 0 };
  if (settings) ({ data, stats } = await recompressJpegs(data, file.name, settings.maxEdge, settings.quality));
  const optimized = await optimizePdf(data, settings?.quality);
  if (optimized && optimized.length < data.length) data = optimized;
  return { data, reencoded: stats.reencoded };
}

export async function compressPdf(file: PdfFile, level: CompressLevel) {
  // Fails early, with a clear message, for damaged or locked files.
  await loadPdf(file);
  const { data, reencoded } = await compressWith(file, compressLevels[level]);
  const smaller = data.length < file.data.length;
  return {
    name: `${pdfBaseName(file.name)}-compressed.pdf`,
    data: smaller ? data : file.data,
    before: file.data.length,
    after: smaller ? data.length : file.data.length,
    reencoded,
  };
}

/**
 * Steps tried, gentlest first, to get under a size limit. Text and vector
 * graphics stay as they are; only embedded JPEG images get smaller.
 */
export const targetSteps: { label: string; settings: Settings }[] = [
  { label: "lossless repacking", settings: null },
  { label: "images at 72% quality, up to 2000 px", settings: compressLevels.medium },
  { label: "images at 50% quality, up to 1400 px", settings: compressLevels.high },
  { label: "images at 40% quality, up to 1100 px", settings: { maxEdge: 1100, quality: 40 } },
  { label: "images at 30% quality, up to 800 px", settings: { maxEdge: 800, quality: 30 } },
];

export type TargetPdfResult = {
  name: string;
  data: Uint8Array;
  before: number;
  after: number;
  reached: boolean;
  /** Which step produced the result. */
  step: string;
};

/** The gentlest step that gets the PDF at or under `target` bytes, or the smallest one tried. */
export async function compressPdfToTarget(file: PdfFile, target: number): Promise<TargetPdfResult> {
  await loadPdf(file);
  const name = `${pdfBaseName(file.name)}-compressed.pdf`;
  const before = file.data.length;
  if (before <= target) return { name: file.name, data: file.data, before, after: before, reached: true, step: "already under the limit" };
  let best = { data: file.data, step: "original" };
  for (const { label, settings } of targetSteps) {
    const { data } = await compressWith(file, settings);
    if (data.length < best.data.length) best = { data, step: label };
    if (data.length <= target) return { name, data, before, after: data.length, reached: true, step: label };
  }
  return { name, data: best.data, before, after: best.data.length, reached: false, step: best.step };
}

export type PageImage = { jpeg: Uint8Array; widthPt: number; heightPt: number };

/** A PDF whose pages are the given JPEG images, each filling a page of the original size. */
export async function pagesToPdf(pages: PageImage[]) {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  for (const page of pages) {
    const image = await doc.embedJpg(page.jpeg);
    doc.addPage([page.widthPt, page.heightPt]).drawImage(image, { x: 0, y: 0, width: page.widthPt, height: page.heightPt });
  }
  return doc.save({ useObjectStreams: true });
}

/**
 * Page-image settings tried, best first, when the PDF must be turned into
 * pictures to reach a small limit: [DPI, JPEG quality].
 */
export const rasterSteps: [number, number][] = [
  [150, 0.75],
  [150, 0.6],
  [120, 0.6],
  [100, 0.55],
  [85, 0.5],
  [72, 0.45],
  [60, 0.4],
  [50, 0.35],
];
