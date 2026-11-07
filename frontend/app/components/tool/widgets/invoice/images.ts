/**
 * Shrinks an uploaded logo or signature to at most `max` px on the long
 * side and returns a PNG data URL (keeps transparency, stays small).
 */
export async function imageToDataUrl(file: File, max = 400): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file (PNG or JPG).");
  if (file.size > 10 * 1024 * 1024) throw new Error("The image is larger than 10 MB.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("This image could not be read. Try a PNG or JPG.");
  });
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/png");
}
