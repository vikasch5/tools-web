/** Browsers refuse or crash on very large canvases; stay well under their limits. */
export const MAX_PAGE_PIXELS = 40_000_000;

/**
 * Pixel size of a page drawn at `dpi` (PDF sizes are in points, 72 per
 * inch). Pages that would exceed MAX_PAGE_PIXELS are scaled down to fit,
 * and `reduced` says so.
 */
export function pageImageSize(widthPt: number, heightPt: number, dpi: number) {
  let scale = dpi / 72;
  const area = widthPt * heightPt * scale * scale;
  const reduced = area > MAX_PAGE_PIXELS;
  if (reduced) scale *= Math.sqrt(MAX_PAGE_PIXELS / area);
  return {
    scale,
    width: Math.max(1, Math.round(widthPt * scale)),
    height: Math.max(1, Math.round(heightPt * scale)),
    reduced,
  };
}

/** "Annual Report.pdf", page 3 of 12, png → "Annual Report-page-03.png". */
export function pageImageName(pdfName: string, page: number, pageCount: number, extension: string) {
  const base = pdfName.replace(/\.pdf$/i, "") || "document";
  return `${base}-page-${String(page).padStart(String(pageCount).length, "0")}.${extension}`;
}
