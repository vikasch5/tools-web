import type { ImageMime } from "./image";

export const targetFormats: { value: ImageMime; label: string; extension: string }[] = [
  { value: "image/jpeg", label: "JPG", extension: "jpg" },
  { value: "image/png", label: "PNG", extension: "png" },
  { value: "image/webp", label: "WebP", extension: "webp" },
];

/** Formats that can hold transparency, judged from the file name. */
const ALPHA_SOURCES = /\.(png|webp|gif|avif|ico|bmp)$/i;

/** "Holiday Photo.PNG" → "Holiday Photo.jpg". */
export function convertedName(name: string, mime: ImageMime) {
  const extension = targetFormats.find((f) => f.value === mime)!.extension;
  return `${name.replace(/\.[^.]+$/, "") || "image"}.${extension}`;
}

/** What converting a file produces, in words (used by the tool's examples). */
export function describeConversion(name: string, mime: ImageMime, background = "white") {
  const out = convertedName(name, mime);
  return mime === "image/jpeg" && ALPHA_SOURCES.test(name)
    ? `${out} (transparent areas filled with ${background})`
    : out;
}
