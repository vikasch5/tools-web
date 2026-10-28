/** One word as laid out on the page, in points from the page's top-left corner. */
export type PageWord = { text: string; x: number; y: number; width: number; height: number };

/** A laid-out document page: its picture (JPEG) and where each word sits. */
export type RenderedPage = { jpeg: Uint8Array; width: number; height: number; words: PageWord[] };

/** Groups words into lines: same baseline (within half a line), left to right. */
export function toLines(words: PageWord[]) {
  const lines: PageWord[][] = [];
  for (const word of [...words].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const line = lines.find((l) => Math.abs(l[0].y - word.y) < Math.min(l[0].height, word.height) * 0.5);
    if (line) line.push(word);
    else lines.push([word]);
  }
  for (const line of lines) line.sort((a, b) => a.x - b.x);
  return lines;
}

/**
 * Builds a PDF with one page per picture. Each word is also written as
 * invisible text in the same place, so the PDF can be searched and text
 * selected and copied. The invisible layer uses a standard font, so it
 * covers Latin-script text; other scripts are visible but not searchable.
 */
export async function pagesToPdf(pages: RenderedPage[], name: string) {
  if (!pages.length) throw new Error("The document has no pages to save.");
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  let searchable = 0;
  let words = 0;
  for (const p of pages) {
    const page = doc.addPage([p.width, p.height]);
    const image = await doc.embedJpg(p.jpeg);
    page.drawImage(image, { x: 0, y: 0, width: p.width, height: p.height });
    // Words on the same line become one run with spaces, so copied text
    // reads as sentences rather than one word per line.
    for (const line of toLines(p.words)) {
      const kept = line.filter((word) => {
        words++;
        try {
          font.encodeText(word.text);
          return true;
        } catch {
          return false; // Characters Helvetica cannot encode.
        }
      });
      if (!kept.length) continue;
      searchable += kept.length;
      const text = kept.map((w) => w.text).join(" ");
      const left = kept[0].x;
      const width = kept[kept.length - 1].x + kept[kept.length - 1].width - left;
      const height = Math.max(...kept.map((w) => w.height));
      const unit = font.widthOfTextAtSize(text, 1);
      if (!unit || width <= 0) continue;
      // Size the invisible text to cover the visible line, so selections line up.
      page.drawText(text, {
        x: left,
        y: p.height - kept[0].y - height * 0.8,
        size: Math.min(width / unit, height * 1.2),
        font,
        opacity: 0,
      });
    }
  }
  return {
    name: `${name.replace(/\.docx$/i, "") || "document"}.pdf`,
    data: await doc.save(),
    pageCount: pages.length,
    searchable: words ? Math.round((searchable / words) * 100) : 0,
  };
}
