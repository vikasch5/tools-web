import type { PDFPage } from "pdf-lib";
import { loadPdf, pdfBaseName, type PdfFile } from "./pdf";
import { parsePageRanges } from "./page-ranges";

/** One page of the output: which source page (0-based) and an extra clockwise turn. */
export type PagePlan = { index: number; turn: number };

/**
 * Builds a new PDF from the source pages in the given order. Pages can be
 * left out, repeated or turned; their content is copied as it is.
 */
export async function arrangePdf(file: PdfFile, plan: PagePlan[], suffix = "organized") {
  if (!plan.length) throw new Error("Keep at least one page.");
  const { PDFDocument, degrees } = await import("pdf-lib");
  const doc = await loadPdf(file);
  const count = doc.getPageCount();
  for (const { index } of plan)
    if (index < 0 || index >= count) throw new Error(`Page ${index + 1} does not exist; this PDF has ${count} pages.`);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, plan.map((p) => p.index));
  pages.forEach((page, i) => {
    const turn = plan[i].turn;
    if (turn % 360 !== 0) page.setRotation(degrees(normalizeAngle(page.getRotation().angle + turn)));
    out.addPage(page);
  });
  return {
    name: `${pdfBaseName(file.name)}-${suffix}.pdf`,
    data: await out.save(),
    pageCount: out.getPageCount(),
  };
}

/** Pages that remain after removing `ranges` ("2, 5-7"), as 0-based indexes. */
export function pagesAfterDeleting(ranges: string, pageCount: number) {
  const remove = new Set(parsePageRanges(ranges, pageCount).flat());
  const keep = Array.from({ length: pageCount }, (_, i) => i).filter((i) => !remove.has(i));
  if (!keep.length) throw new Error("That would remove every page. Keep at least one.");
  return keep;
}

export const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

/* ---------- Drawing on a page the way the reader sees it ---------- */

/**
 * The page as displayed: its visible box (the crop box) after /Rotate is
 * applied. `toPage` maps a point measured from the displayed bottom-left
 * corner to the page's own coordinates, and `angle` is the rotation to
 * draw with so text and images appear upright.
 */
export function displayFrame(box: { x: number; y: number; width: number; height: number }, rotation: number) {
  const r = normalizeAngle(Math.round(rotation / 90) * 90);
  const { x, y, width: w, height: h } = box;
  const sideways = r === 90 || r === 270;
  const toPage = (u: number, v: number): { x: number; y: number } => {
    switch (r) {
      case 90:
        return { x: x + w - v, y: y + u };
      case 180:
        return { x: x + w - u, y: y + h - v };
      case 270:
        return { x: x + v, y: y + h - u };
      default:
        return { x: x + u, y: y + v };
    }
  };
  return { width: sideways ? h : w, height: sideways ? w : h, angle: r, toPage };
}

const frameOf = (page: PDFPage) => displayFrame(page.getCropBox(), page.getRotation().angle);

/* ---------- Page numbers ---------- */

export type NumberPosition =
  | "bottom-center"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "top-right"
  | "top-left";
export type NumberFormat = "n" | "page-n" | "n-of-total" | "page-n-of-total";

export type PageNumberOptions = {
  position: NumberPosition;
  format: NumberFormat;
  /** Number printed on the first numbered page. */
  start: number;
  /** Font size in points. */
  size: number;
  /** Pages to number, e.g. "2-" to skip a cover. Empty means every page. */
  pages: string;
};

export function pageNumberLabel(format: NumberFormat, n: number, total: number) {
  switch (format) {
    case "page-n":
      return `Page ${n}`;
    case "n-of-total":
      return `${n} of ${total}`;
    case "page-n-of-total":
      return `Page ${n} of ${total}`;
    default:
      return String(n);
  }
}

/** Ink of the page numbers, drawn on paper whatever the site theme. */
export const PAGE_NUMBER_INK = { r: 0.13, g: 0.13, b: 0.13, css: "rgb(33 33 33)" };

/** Edge distance in points: about 0.5 in, a common footer position. */
const EDGE = 36;

/** Where a label of the given width sits on a displayed page, measured from its bottom-left. */
export function labelOrigin(position: NumberPosition, page: { width: number; height: number }, textWidth: number, size: number) {
  const [vertical, horizontal] = position.split("-") as ["top" | "bottom", "left" | "center" | "right"];
  const u = horizontal === "left" ? EDGE : horizontal === "right" ? page.width - EDGE - textWidth : (page.width - textWidth) / 2;
  // Cap height of Helvetica is about 0.72 of the size.
  const v = vertical === "bottom" ? EDGE - size * 0.36 : page.height - EDGE - size * 0.36;
  return { u: round(u), v: round(v) };
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Which pages get a number and what it says. Numbering counts only the
 * chosen pages, so "2-" with start 1 puts 1 on the second page; the total
 * is the number of numbered pages plus the start offset.
 */
export function planPageNumbers(pageCount: number, options: Pick<PageNumberOptions, "format" | "start" | "pages">) {
  const chosen = options.pages.trim()
    ? [...new Set(parsePageRanges(options.pages, pageCount).flat())].sort((a, b) => a - b)
    : Array.from({ length: pageCount }, (_, i) => i);
  const total = chosen.length + options.start - 1;
  return chosen.map((index, i) => ({ index, label: pageNumberLabel(options.format, options.start + i, total) }));
}

export async function addPageNumbers(file: PdfFile, options: PageNumberOptions) {
  if (!Number.isInteger(options.start) || options.start < 0) throw new Error("The first number must be 0 or more.");
  const { StandardFonts, rgb, degrees } = await import("pdf-lib");
  const doc = await loadPdf(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const plan = planPageNumbers(pages.length, options);
  for (const { index, label } of plan) {
    const page = pages[index];
    const frame = frameOf(page);
    const width = font.widthOfTextAtSize(label, options.size);
    const { u, v } = labelOrigin(options.position, frame, width, options.size);
    const at = frame.toPage(u, v);
    page.drawText(label, { ...at, size: options.size, font, color: rgb(PAGE_NUMBER_INK.r, PAGE_NUMBER_INK.g, PAGE_NUMBER_INK.b), rotate: degrees(frame.angle) });
  }
  return {
    name: `${pdfBaseName(file.name)}-numbered.pdf`,
    data: await doc.save(),
    numbered: plan.length,
  };
}

/* ---------- Watermark ---------- */

export type WatermarkImage = { data: Uint8Array; type: "image/png" | "image/jpeg"; width: number; height: number };

export type WatermarkOptions = {
  /** Width of the mark as a share of the displayed page width, 0.05–1. */
  scale: number;
  /** 0.05–1. */
  opacity: number;
  /** Counter-clockwise tilt in degrees as seen by the reader. */
  angle: number;
  layout: "center" | "tile";
  /** Pages to mark; empty means every page. */
  pages: string;
};

/**
 * Bottom-left corners of each copy of a mark of size (w, h) on a displayed
 * page, so that the mark, turned by `angle` around its own centre, is
 * centred on the page (center) or repeated in a grid (tile).
 */
export function watermarkPlacements(page: { width: number; height: number }, mark: { width: number; height: number }, angle: number, layout: "center" | "tile") {
  const centres: { u: number; v: number }[] = [];
  if (layout === "center") centres.push({ u: page.width / 2, v: page.height / 2 });
  else {
    const t = (angle * Math.PI) / 180;
    // Bounding box of the turned mark, plus a gap.
    const bw = Math.abs(mark.width * Math.cos(t)) + Math.abs(mark.height * Math.sin(t));
    const bh = Math.abs(mark.width * Math.sin(t)) + Math.abs(mark.height * Math.cos(t));
    const stepU = bw * 1.35;
    const stepV = Math.max(bh * 1.6, mark.height * 3);
    const cols = Math.max(1, Math.ceil(page.width / stepU));
    const rows = Math.max(1, Math.ceil(page.height / stepV));
    const offU = (page.width - (cols - 1) * stepU) / 2;
    const offV = (page.height - (rows - 1) * stepV) / 2;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) centres.push({ u: offU + c * stepU, v: offV + r * stepV });
  }
  const t = (angle * Math.PI) / 180;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  // Offset from the centre to the bottom-left corner, turned with the mark.
  const du = (-mark.width / 2) * cos - (-mark.height / 2) * sin;
  const dv = (-mark.width / 2) * sin + (-mark.height / 2) * cos;
  return centres.map((c) => ({ u: round(c.u + du), v: round(c.v + dv) }));
}

export async function addWatermark(file: PdfFile, image: WatermarkImage, options: WatermarkOptions) {
  const { degrees } = await import("pdf-lib");
  const doc = await loadPdf(file);
  const embedded = image.type === "image/png" ? await doc.embedPng(image.data) : await doc.embedJpg(image.data);
  const pages = doc.getPages();
  const chosen = options.pages.trim()
    ? new Set(parsePageRanges(options.pages, pages.length).flat())
    : null;
  let marked = 0;
  pages.forEach((page, index) => {
    if (chosen && !chosen.has(index)) return;
    const frame = frameOf(page);
    const width = frame.width * Math.min(1, Math.max(0.05, options.scale));
    const height = (width * image.height) / image.width;
    for (const { u, v } of watermarkPlacements(frame, { width, height }, options.angle, options.layout)) {
      const at = frame.toPage(u, v);
      page.drawImage(embedded, {
        ...at,
        width,
        height,
        opacity: Math.min(1, Math.max(0.05, options.opacity)),
        rotate: degrees(frame.angle + options.angle),
      });
    }
    marked++;
  });
  return { name: `${pdfBaseName(file.name)}-watermarked.pdf`, data: await doc.save(), marked };
}

/** Watermark inks, printed on paper whatever the site theme. */
export const watermarkInks = [
  { value: "grey", label: "Grey", css: "rgb(107 114 128)" },
  { value: "red", label: "Red", css: "rgb(220 38 38)" },
  { value: "blue", label: "Blue", css: "rgb(37 99 235)" },
  { value: "black", label: "Black", css: "rgb(17 24 39)" },
] as const;
