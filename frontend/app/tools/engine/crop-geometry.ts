import type { Rect, Size } from "./image-geometry";

export type Handle = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export const aspectChoices = [
  { value: "free", label: "Free", ratio: 0 },
  { value: "1:1", label: "1:1", ratio: 1 },
  { value: "4:5", label: "4:5", ratio: 4 / 5 },
  { value: "3:4", label: "3:4", ratio: 3 / 4 },
  { value: "4:3", label: "4:3", ratio: 4 / 3 },
  { value: "16:9", label: "16:9", ratio: 16 / 9 },
  { value: "9:16", label: "9:16", ratio: 9 / 16 },
] as const;

export const turnedSize = (size: Size, turn: number): Size =>
  turn % 2 === 1 ? { width: size.height, height: size.width } : size;

const round = (r: Rect): Rect => ({
  x: Math.round(r.x),
  y: Math.round(r.y),
  width: Math.round(r.width),
  height: Math.round(r.height),
});

/** Keeps a rect inside the image and at least `min` pixels on each side. */
export function clampRect(rect: Rect, bounds: Size, min = 8): Rect {
  const width = Math.min(Math.max(rect.width, min), bounds.width);
  const height = Math.min(Math.max(rect.height, min), bounds.height);
  return round({
    x: Math.min(Math.max(rect.x, 0), bounds.width - width),
    y: Math.min(Math.max(rect.y, 0), bounds.height - height),
    width,
    height,
  });
}

/** The largest centred rect of an aspect ratio (width / height); 0 = the whole image. */
export function centredRect(bounds: Size, ratio: number, fill = 1): Rect {
  let width = bounds.width * fill;
  let height = bounds.height * fill;
  if (ratio) {
    if (width / height > ratio) width = height * ratio;
    else height = width / ratio;
  }
  return round({ x: (bounds.width - width) / 2, y: (bounds.height - height) / 2, width, height });
}

/**
 * Applies a drag of (dx, dy) image pixels to a crop rect: "move" pans it,
 * an edge or corner handle resizes it from the opposite side. With a ratio
 * the shape is kept, following the larger of the two movements.
 */
export function dragRect(start: Rect, handle: Handle, dx: number, dy: number, bounds: Size, ratio = 0, min = 8): Rect {
  if (handle === "move") return clampRect({ ...start, x: start.x + dx, y: start.y + dy }, bounds, min);

  let left = start.x;
  let top = start.y;
  let right = start.x + start.width;
  let bottom = start.y + start.height;
  if (handle.includes("w")) left = Math.min(Math.max(0, left + dx), right - min);
  if (handle.includes("e")) right = Math.max(Math.min(bounds.width, right + dx), left + min);
  if (handle.includes("n")) top = Math.min(Math.max(0, top + dy), bottom - min);
  if (handle.includes("s")) bottom = Math.max(Math.min(bounds.height, bottom + dy), top + min);

  if (ratio) {
    let width = right - left;
    let height = bottom - top;
    const horizontal = handle === "e" || handle === "w";
    const vertical = handle === "n" || handle === "s";
    if (horizontal || (!vertical && width / ratio >= height)) height = width / ratio;
    else width = height * ratio;
    // Grow from the fixed side, staying inside the image.
    const maxWidth = handle.includes("w") ? right : bounds.width - left;
    const maxHeight = handle.includes("n") ? bottom : bounds.height - top;
    const fit = Math.min(1, maxWidth / width, maxHeight / height);
    width *= fit;
    height *= fit;
    if (handle.includes("w")) left = right - width;
    else right = left + width;
    if (handle.includes("n")) top = bottom - height;
    else if (vertical || handle.includes("s")) bottom = top + height;
    else {
      // Pure horizontal drag: keep the centre line.
      const middle = (start.y + start.y + start.height) / 2;
      top = middle - height / 2;
      bottom = top + height;
    }
    if (vertical) {
      const centre = (start.x + start.x + start.width) / 2;
      left = centre - width / 2;
      right = left + width;
    }
  }
  return clampRect({ x: left, y: top, width: right - left, height: bottom - top }, bounds, min);
}
