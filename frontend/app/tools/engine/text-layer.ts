/** Font size in pixels for a text sized as a share (%) of the image's shorter side. */
export const fontPixels = (sizePercent: number, width: number, height: number) =>
  Math.max(4, Math.round((sizePercent / 100) * Math.min(width, height)));

export function describeTextSize(sizePercent: number, width: number, height: number) {
  return `${fontPixels(sizePercent, width, height)} px text`;
}
