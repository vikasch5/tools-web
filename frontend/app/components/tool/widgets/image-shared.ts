import { useCallback, useEffect, useState } from "react";
import type { ImageMime } from "~/tools/engine/image";
import type { Size } from "~/tools/engine/image-geometry";

export const IMAGE_ACCEPT = [".jpg", ".jpeg", ".png", ".webp"];
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

export type FormatChoice = "same" | "jpeg" | "webp" | "png";
export const formatChoices: { value: FormatChoice; label: string }[] = [
  { value: "same", label: "Same" },
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WebP" },
  { value: "png", label: "PNG" },
];

export function mimeFor(file: File, choice: FormatChoice): ImageMime {
  if (choice === "jpeg") return "image/jpeg";
  if (choice === "webp") return "image/webp";
  if (choice === "png") return "image/png";
  return file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
}

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function outputName(file: File, mime: string, suffix: string) {
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return `${base}-${suffix}.${extensions[mime] ?? "img"}`;
}

/** Browsers without an encoder for a type silently return PNG; say so. */
export function encoderNote(requested: string, actual: string) {
  if (requested === actual) return null;
  const name = (m: string) => (extensions[m] ?? m).toUpperCase();
  return `Your browser cannot save ${name(requested)}, so the image was saved as ${name(actual)}.`;
}

/** Reads display size (EXIF rotation applied) and keeps a preview URL. */
export function useImageSource() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [error, setError] = useState("");

  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);

  const load = useCallback((next: File) => {
    const objectUrl = URL.createObjectURL(next);
    const img = new Image();
    img.onload = () => {
      setFile(next);
      setUrl(objectUrl);
      setSize({ width: img.naturalWidth, height: img.naturalHeight });
      setError("");
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError(`“${next.name}” could not be opened as an image. Use JPG, PNG or WebP.`);
    };
    img.src = objectUrl;
  }, []);

  const clear = useCallback(() => {
    setFile(null);
    setUrl(null);
    setSize(null);
    setError("");
  }, []);

  return { file, url, size, error, setError, load, clear };
}
