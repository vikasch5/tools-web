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

export async function compressPdf(file: PdfFile, level: CompressLevel) {
  // Fails early, with a clear message, for damaged or locked files.
  await loadPdf(file);
  const settings = compressLevels[level];
  let data = file.data;
  let stats: ImageStats = { images: 0, reencoded: 0 };
  if (settings) ({ data, stats } = await recompressJpegs(data, file.name, settings.maxEdge, settings.quality));
  const optimized = await optimizePdf(data, settings?.quality);
  if (optimized && optimized.length < data.length) data = optimized;
  const smaller = data.length < file.data.length;
  return {
    name: `${pdfBaseName(file.name)}-compressed.pdf`,
    data: smaller ? data : file.data,
    before: file.data.length,
    after: smaller ? data.length : file.data.length,
    reencoded: stats.reencoded,
  };
}
