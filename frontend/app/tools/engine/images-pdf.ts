export type PageSize = "fit" | "a4" | "letter";
export type Orientation = "auto" | "portrait" | "landscape";
export type Margin = "none" | "small" | "large";

export type PdfImage = { name: string; data: Uint8Array; type: "image/jpeg" | "image/png"; width: number; height: number };
export type ImagesPdfOptions = { pageSize: PageSize; orientation: Orientation; margin: Margin };

/** Page sizes in PDF points (1/72 in). */
const sizes = { a4: { width: 595.28, height: 841.89 }, letter: { width: 612, height: 792 } };
const margins: Record<Margin, number> = { none: 0, small: 18, large: 36 };

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Where an image sits on its page. "fit" makes the page the image's own size
 * (at 96 px per inch); A4 and Letter scale the image down to fit inside the
 * margins, centred, never enlarging it past its natural size.
 */
export function pageLayout(image: { width: number; height: number }, { pageSize, orientation, margin }: ImagesPdfOptions) {
  const pad = margins[margin];
  // CSS pixels to points, so a 1920 px wide screenshot becomes a 20 in page.
  const natural = { width: (image.width * 72) / 96, height: (image.height * 72) / 96 };
  if (pageSize === "fit") {
    return {
      page: { width: round(natural.width + pad * 2), height: round(natural.height + pad * 2) },
      image: { x: pad, y: pad, width: round(natural.width), height: round(natural.height) },
    };
  }
  const base = sizes[pageSize];
  const landscape = orientation === "landscape" || (orientation === "auto" && image.width > image.height);
  const page = landscape ? { width: base.height, height: base.width } : base;
  const box = { width: page.width - pad * 2, height: page.height - pad * 2 };
  const scale = Math.min(box.width / natural.width, box.height / natural.height, 1);
  const width = natural.width * scale;
  const height = natural.height * scale;
  return {
    page: { width: round(page.width), height: round(page.height) },
    image: { x: round((page.width - width) / 2), y: round((page.height - height) / 2), width: round(width), height: round(height) },
  };
}

/** One page per image, in order. JPEGs are embedded as they are, without re-compressing. */
export async function imagesToPdf(images: PdfImage[], options: ImagesPdfOptions) {
  if (!images.length) throw new Error("Add at least one image.");
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  for (const img of images) {
    let embedded;
    try {
      embedded = img.type === "image/png" ? await doc.embedPng(img.data) : await doc.embedJpg(img.data);
    } catch {
      throw new Error(`“${img.name}” could not be added. It may be damaged.`);
    }
    const layout = pageLayout(img, options);
    const page = doc.addPage([layout.page.width, layout.page.height]);
    page.drawImage(embedded, layout.image);
  }
  return { data: await doc.save(), pageCount: doc.getPageCount() };
}

/**
 * EXIF orientation of a JPEG (1 = upright). Photos from phones are often
 * stored sideways with a tag saying how to turn them; a PDF ignores that tag,
 * so such photos are redrawn upright before embedding.
 */
export function jpegOrientation(data: Uint8Array) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && offset + 10 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966) {
      const tiff = offset + 10;
      if (tiff + 8 > view.byteLength) return 1;
      const little = view.getUint16(tiff) === 0x4949;
      const ifd = tiff + view.getUint32(tiff + 4, little);
      if (ifd + 2 > view.byteLength) return 1;
      const entries = view.getUint16(ifd, little);
      for (let i = 0; i < entries; i++) {
        const entry = ifd + 2 + i * 12;
        if (entry + 10 > view.byteLength) return 1;
        if (view.getUint16(entry, little) === 0x0112) return view.getUint16(entry + 8, little);
      }
      return 1;
    }
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return 1;
    offset += 2 + size;
  }
  return 1;
}

/** Summary used by the published examples. */
export function describeLayout(image: { width: number; height: number }, options: ImagesPdfOptions) {
  const { page, image: box } = pageLayout(image, options);
  const inches = (pt: number) => (pt / 72).toFixed(2).replace(/\.?0+$/, "");
  return `Page ${page.width} × ${page.height} pt (${inches(page.width)} × ${inches(page.height)} in)\nImage ${box.width} × ${box.height} pt at (${box.x}, ${box.y})`;
}
