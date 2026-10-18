export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const MAX_SIDE = 16384;

/**
 * Target size for Resize Image. With keepRatio, a missing (0/NaN) side is
 * derived from the other; if both are set the image fits inside the box.
 */
export function resizeDimensions(
  source: Size,
  request:
    | { mode: "percent"; percent: number }
    | { mode: "pixels"; width?: number; height?: number; keepRatio: boolean },
): Size {
  let width: number;
  let height: number;
  if (request.mode === "percent") {
    const p = (request.percent || 100) / 100;
    width = source.width * p;
    height = source.height * p;
  } else {
    const w = request.width && request.width > 0 ? request.width : 0;
    const h = request.height && request.height > 0 ? request.height : 0;
    const ratio = source.width / source.height;
    if (!request.keepRatio) {
      width = w || source.width;
      height = h || source.height;
    } else if (w && h) {
      const scale = Math.min(w / source.width, h / source.height);
      width = source.width * scale;
      height = source.height * scale;
    } else if (w) {
      width = w;
      height = w / ratio;
    } else if (h) {
      height = h;
      width = h * ratio;
    } else {
      width = source.width;
      height = source.height;
    }
  }
  return {
    width: clamp(Math.round(width), 1, MAX_SIDE),
    height: clamp(Math.round(height), 1, MAX_SIDE),
  };
}

/** Largest size within maxSide on the long edge (never upscales). */
export function limitLongEdge(source: Size, maxSide: number): Size {
  const long = Math.max(source.width, source.height);
  if (!maxSide || long <= maxSide) return source;
  const scale = maxSide / long;
  return { width: Math.round(source.width * scale), height: Math.round(source.height * scale) };
}

/**
 * Crop for an aspect ratio that covers the image, then zooms in by `zoom`
 * (≥ 1) and pans by offsetX/offsetY (−1…1, 0 = centred).
 */
export function coverCrop(
  source: Size,
  aspect: number,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
): Rect {
  let width = source.width;
  let height = width / aspect;
  if (height > source.height) {
    height = source.height;
    width = height * aspect;
  }
  width /= Math.max(zoom, 1);
  height /= Math.max(zoom, 1);
  const spareX = source.width - width;
  const spareY = source.height - height;
  return {
    x: (spareX / 2) * (1 + clamp(offsetX, -1, 1)),
    y: (spareY / 2) * (1 + clamp(offsetY, -1, 1)),
    width,
    height,
  };
}

export type PassportPreset = {
  id: string;
  label: string;
  /** Printed size in millimetres. */
  widthMm: number;
  heightMm: number;
  note: string;
};

/** Common official sizes. Rules change: the page tells people to check. */
export const passportPresets: PassportPreset[] = [
  { id: "us", label: "US passport & visa (2 × 2 in)", widthMm: 50.8, heightMm: 50.8, note: "Head 1–1⅜ in (25–35 mm) from chin to top of hair." },
  { id: "eu", label: "UK, EU & Schengen (35 × 45 mm)", widthMm: 35, heightMm: 45, note: "Face 29–34 mm from chin to crown on most EU forms." },
  { id: "in", label: "India passport (35 × 45 mm)", widthMm: 35, heightMm: 45, note: "Face should cover about 80% of the photo." },
  { id: "in-visa", label: "India visa (2 × 2 in)", widthMm: 50.8, heightMm: 50.8, note: "Square photo, plain light background." },
  { id: "ca", label: "Canada passport (50 × 70 mm)", widthMm: 50, heightMm: 70, note: "Face 31–36 mm from chin to crown." },
  { id: "cn", label: "China visa (33 × 48 mm)", widthMm: 33, heightMm: 48, note: "Head 28–33 mm from chin to crown." },
  { id: "au", label: "Australia passport (35 × 45 mm)", widthMm: 35, heightMm: 45, note: "Face 32–36 mm from chin to crown." },
  { id: "jp", label: "Japan passport (35 × 45 mm)", widthMm: 35, heightMm: 45, note: "Face 32–36 mm from chin to crown." },
];

export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);

export type SheetLayout = {
  sheet: Size;
  photo: Size;
  columns: number;
  rows: number;
  /** Top-left corner of each photo, in pixels. */
  positions: { x: number; y: number }[];
};

/**
 * Tiles photos on a print sheet (e.g. 6 × 4 in at 300 DPI), centred, with a
 * gap for cutting where there is room for one.
 */
export function sheetLayout(
  preset: Pick<PassportPreset, "widthMm" | "heightMm">,
  sheetMm: { width: number; height: number },
  dpi = 300,
  gapMm = 2,
): SheetLayout {
  const sheet = { width: mmToPx(sheetMm.width, dpi), height: mmToPx(sheetMm.height, dpi) };
  const photo = { width: mmToPx(preset.widthMm, dpi), height: mmToPx(preset.heightMm, dpi) };
  // Per axis: keep the cutting gap unless dropping it fits another photo.
  const fit = (space: number, size: number) => {
    const gap = mmToPx(gapMm, dpi);
    const withGap = Math.floor((space + gap) / (size + gap));
    const tight = Math.floor(space / size);
    return tight > withGap ? { count: tight, gap: 0 } : { count: withGap, gap };
  };
  const x = fit(sheet.width, photo.width);
  const y = fit(sheet.height, photo.height);
  const columns = Math.max(0, x.count);
  const rows = Math.max(0, y.count);
  const left = Math.round((sheet.width - (columns * photo.width + (columns - 1) * x.gap)) / 2);
  const top = Math.round((sheet.height - (rows * photo.height + (rows - 1) * y.gap)) / 2);
  const positions = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < columns; c++)
      positions.push({ x: left + c * (photo.width + x.gap), y: top + r * (photo.height + y.gap) });
  return { sheet, photo, columns, rows, positions };
}
