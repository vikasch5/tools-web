import { createRequire } from "node:module";
import { inflateRawSync } from "node:zlib";
import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, degrees } from "pdf-lib";
import {
  addPageNumbers,
  addWatermark,
  arrangePdf,
  displayFrame,
  labelOrigin,
  pagesAfterDeleting,
  planPageNumbers,
  watermarkPlacements,
} from "./pdf-pages";
import { encryptionStatus, optimizePdf, protectPdf, setQpdfWasmLocation, unlockPdf } from "./qpdf";
import { compressPdf, describeLevel, sizeChange } from "./pdf-compress";
import { bodyTextSize, buildDocx, describeBlocks, pageBlocks, textToWordPages, type TextItem } from "./pdf-word";

const require = createRequire(import.meta.url);
beforeAll(() => setQpdfWasmLocation(require.resolve("@neslinesli93/qpdf-wasm/dist/qpdf.wasm")));

async function textPdf(pages: number, { rotate = 0 } = {}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([400, 600]);
    page.drawText(`Page body ${i + 1}`, { x: 40, y: 500, size: 14, font });
    if (rotate) page.setRotation(degrees(rotate));
  }
  return { name: "report.pdf", data: await doc.save({ useObjectStreams: false }) };
}

/** Reads one entry back out of a ZIP written by createZip (stored) or a real one (deflated). */
function unzipEntry(zip: Uint8Array, wanted: string) {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    const method = view.getUint16(offset + 8, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extra = view.getUint16(offset + 28, true);
    const name = new TextDecoder().decode(zip.subarray(offset + 30, offset + 30 + nameLength));
    const start = offset + 30 + nameLength + extra;
    const body = zip.subarray(start, start + size);
    if (name === wanted) return new TextDecoder().decode(method === 8 ? inflateRawSync(body) : body);
    offset = start + size;
  }
  throw new Error(`${wanted} not found`);
}

describe("arrange and delete pages", () => {
  it("reorders, repeats and turns pages", async () => {
    const r = await arrangePdf(await textPdf(3), [
      { index: 2, turn: 90 },
      { index: 0, turn: 0 },
      { index: 0, turn: -90 },
    ]);
    const out = await PDFDocument.load(r.data);
    expect(r).toMatchObject({ name: "report-organized.pdf", pageCount: 3 });
    expect(out.getPages().map((p) => p.getRotation().angle)).toEqual([90, 0, 270]);
  });

  it("refuses an empty plan and missing pages", async () => {
    const file = await textPdf(2);
    await expect(arrangePdf(file, [])).rejects.toThrow("at least one page");
    await expect(arrangePdf(file, [{ index: 5, turn: 0 }])).rejects.toThrow("Page 6 does not exist");
  });

  it("works out which pages remain", () => {
    expect(pagesAfterDeleting("2, 4-5", 6)).toEqual([0, 2, 5]);
    expect(() => pagesAfterDeleting("1-3", 3)).toThrow("every page");
    expect(() => pagesAfterDeleting("9", 3)).toThrow("does not exist");
  });
});

describe("drawing on displayed pages", () => {
  const box = { x: 0, y: 0, width: 400, height: 600 };
  it("maps displayed corners back to page corners for each rotation", () => {
    expect(displayFrame(box, 0).toPage(0, 0)).toEqual({ x: 0, y: 0 });
    const r90 = displayFrame(box, 90);
    expect([r90.width, r90.height]).toEqual([600, 400]);
    // Displayed bottom-left of a page turned clockwise is the page's top-left.
    expect(r90.toPage(0, 0)).toEqual({ x: 400, y: 0 });
    expect(r90.toPage(600, 400)).toEqual({ x: 0, y: 600 });
    expect(displayFrame(box, 180).toPage(0, 0)).toEqual({ x: 400, y: 600 });
    expect(displayFrame(box, 270).toPage(0, 0)).toEqual({ x: 0, y: 600 });
    expect(displayFrame({ x: 10, y: 20, width: 100, height: 50 }, 0).toPage(5, 5)).toEqual({ x: 15, y: 25 });
  });

  it("places page numbers by position", () => {
    const page = { width: 612, height: 792 };
    expect(labelOrigin("bottom-center", page, 20, 10)).toEqual({ u: 296, v: 32.4 });
    expect(labelOrigin("top-right", page, 20, 10)).toEqual({ u: 556, v: 752.4 });
    expect(labelOrigin("bottom-left", page, 20, 10).u).toBe(36);
  });

  it("numbers only the chosen pages, counting from the start number", () => {
    expect(planPageNumbers(4, { format: "page-n-of-total", start: 1, pages: "2-" })).toEqual([
      { index: 1, label: "Page 1 of 3" },
      { index: 2, label: "Page 2 of 3" },
      { index: 3, label: "Page 3 of 3" },
    ]);
    expect(planPageNumbers(3, { format: "n", start: 5, pages: "" }).map((p) => p.label)).toEqual(["5", "6", "7"]);
  });

  it("adds numbers to rotated pages without errors", async () => {
    const r = await addPageNumbers(await textPdf(2, { rotate: 90 }), {
      position: "bottom-center",
      format: "n-of-total",
      start: 1,
      size: 11,
      pages: "",
    });
    expect(r).toMatchObject({ name: "report-numbered.pdf", numbered: 2 });
    expect((await PDFDocument.load(r.data)).getPageCount()).toBe(2);
  });

  it("centres a turned watermark and tiles a grid", () => {
    const [centre] = watermarkPlacements({ width: 600, height: 800 }, { width: 300, height: 60 }, 0, "center");
    expect(centre).toEqual({ u: 150, v: 370 });
    const [turned] = watermarkPlacements({ width: 600, height: 800 }, { width: 200, height: 0 }, 90, "center");
    expect(turned).toEqual({ u: 300, v: 300 });
    expect(watermarkPlacements({ width: 600, height: 800 }, { width: 100, height: 20 }, 0, "tile").length).toBeGreaterThan(4);
  });

  it("stamps a PNG watermark on the chosen pages", async () => {
    const png = Uint8Array.from(
      atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
      (c) => c.charCodeAt(0),
    );
    const r = await addWatermark(
      await textPdf(3),
      { data: png, type: "image/png", width: 1, height: 1 },
      { scale: 0.5, opacity: 0.3, angle: 45, layout: "center", pages: "1, 3" },
    );
    expect(r).toMatchObject({ name: "report-watermarked.pdf", marked: 2 });
  });
});

describe("qpdf: protect, unlock and compress", () => {
  it("protects with a password and unlocks with the same one", async () => {
    const file = await textPdf(2);
    const locked = await protectPdf(file, "s3cret pass");
    expect(locked.name).toBe("report-protected.pdf");
    await expect(PDFDocument.load(locked.data)).rejects.toThrow(/encrypted/i);
    await expect(unlockPdf({ name: "a.pdf", data: locked.data }, "wrong")).rejects.toThrow("not correct");
    await expect(unlockPdf({ name: "a.pdf", data: locked.data }, "")).rejects.toThrow("needs its password");
    expect(await encryptionStatus(file)).toBe("none");
    expect(await encryptionStatus(locked)).toBe("password");
    const open = await unlockPdf({ name: "report-protected.pdf", data: locked.data }, "s3cret pass");
    expect(open.name).toBe("report-protected-unlocked.pdf");
    expect((await PDFDocument.load(open.data)).getPageCount()).toBe(2);
  });

  it("removes print and copy restrictions from a PDF that opens without a password", async () => {
    const createModule = require("@neslinesli93/qpdf-wasm");
    const q = await createModule({
      locateFile: () => require.resolve("@neslinesli93/qpdf-wasm/dist/qpdf.wasm"),
      print: () => {},
      printErr: () => {},
    });
    q.FS.writeFile("/plain.pdf", (await textPdf(1)).data);
    q.callMain(["--encrypt", "--user-password=", "--owner-password=owner", "--bits=256", "--print=none", "--extract=n", "--", "/plain.pdf", "/r.pdf"]);
    const restricted = { name: "r.pdf", data: q.FS.readFile("/r.pdf") as Uint8Array };
    expect(await encryptionStatus(restricted)).toBe("restricted");
    const open = await unlockPdf(restricted, "");
    expect((await PDFDocument.load(open.data)).isEncrypted).toBe(false);
  });

  it("rejects short passwords, double protection and unlocking a plain PDF", async () => {
    const file = await textPdf(1);
    await expect(protectPdf(file, "abc")).rejects.toThrow("at least 4");
    const locked = await protectPdf(file, "abcd");
    await expect(protectPdf({ name: "x.pdf", data: locked.data }, "abcd")).rejects.toThrow("already has a password");
    await expect(unlockPdf(file, "abcd")).rejects.toThrow("not password-protected");
  });

  it("compresses losslessly and never returns a bigger file", async () => {
    const file = await textPdf(5);
    const r = await compressPdf(file, "low");
    expect(r.after).toBeLessThan(r.before);
    expect((await PDFDocument.load(r.data)).getPageCount()).toBe(5);
    const again = await compressPdf({ name: "report.pdf", data: r.data }, "low");
    expect(again.after).toBeLessThanOrEqual(r.after);
  });

  it("re-encodes uncompressed images as JPEG on the stronger levels", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([300, 300]);
    const width = 300;
    // A smooth gradient with grain, like a photo: Flate packs it badly, JPEG well.
    let seed = 7;
    const grain = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) % 24);
    const pixels = new Uint8Array(width * width * 3).map((_, i) => ((Math.floor(i / 3) % width) * 0.8 + grain()) % 256);
    const image = doc.context.flateStream(pixels, {
      Type: "XObject",
      Subtype: "Image",
      Width: width,
      Height: width,
      ColorSpace: "DeviceRGB",
      BitsPerComponent: 8,
    });
    page.node.setXObject((await import("pdf-lib")).PDFName.of("Im1"), doc.context.register(image));
    const data = await doc.save();
    const lossless = await optimizePdf(data);
    const lossy = await optimizePdf(data, 50);
    expect(lossless).not.toBeNull();
    expect(lossy!.length).toBeLessThan(lossless!.length);
  });

  it("describes levels and size changes", () => {
    expect(describeLevel("medium")).toBe("Recommended: images over 2000 px scaled down, JPEG quality 72%");
    expect(sizeChange(1000, 620)).toBe("−38%");
    expect(sizeChange(1000, 1000)).toBe("0%");
  });
});

describe("PDF to Word", () => {
  const item = (text: string, x: number, y: number, size = 11, extra: Partial<TextItem> = {}): TextItem => ({
    text,
    x,
    y,
    width: text.length * size * 0.5,
    size,
    bold: false,
    italic: false,
    ...extra,
  });

  it("joins wrapped lines, finds headings, lists and hyphenated words", () => {
    const page = {
      width: 612,
      height: 792,
      items: [
        item("Annual Report", 220, 720, 24, { bold: true }),
        item("This year the team shipped", 72, 680),
        item("forty-two tools and an inter-", 72, 666),
        item("national version.", 72, 652),
        item("Second paragraph starts here.", 72, 610),
        item("• First point", 72, 580),
        item("• Second point", 72, 566),
      ],
    };
    const blocks = pageBlocks(page, 11);
    expect(blocks.map((b) => b.kind)).toEqual(["heading1", "paragraph", "paragraph", "list", "list"]);
    expect(blocks[0].align).toBe("center");
    expect(blocks[1].runs.map((r) => r.text).join("")).toBe(
      "This year the team shipped forty-two tools and an international version.",
    );
    expect(blocks[3].runs[0].text).toBe("• First point");
  });

  it("merges pieces of one line and keeps bold runs", () => {
    const page = {
      width: 612,
      height: 792,
      items: [item("Total:", 72, 700, 11, { bold: true }), item("1,250", 110, 700.5)],
    };
    const [block] = pageBlocks(page, 11);
    expect(block.runs).toEqual([
      { text: "Total:", bold: true, italic: false, size: 11 },
      { text: " 1,250", bold: false, italic: false, size: 11 },
    ]);
  });

  it("finds the body size and refuses scans without text", () => {
    expect(bodyTextSize([{ width: 1, height: 1, items: [item("Big", 0, 0, 30), item("long body text here", 0, 0, 10)] }])).toBe(10);
    expect(() => textToWordPages([{ width: 612, height: 792, items: [] }])).toThrow("OCR");
  });

  it("writes a .docx Word can open", () => {
    const pages = textToWordPages([
      { width: 612, height: 792, items: [item("Title & <intro>", 72, 720, 20), item("Body text on page one.", 72, 680)] },
      { width: 612, height: 792, items: [item("Page two text.", 72, 720)] },
    ]);
    expect(describeBlocks(pages)).toBe("2 pages, 1 heading, 2 paragraphs");
    const docx = buildDocx(pages, 11);
    const document = unzipEntry(docx, "word/document.xml");
    expect(document).toContain("Title &amp; &lt;intro&gt;");
    expect(document).toContain('<w:pStyle w:val="Heading1"/>');
    expect(document.match(/<w:pageBreakBefore\/>/g)).toHaveLength(1);
    expect(document).toContain('<w:pgSz w:w="12240" w:h="15840"/>');
    expect(unzipEntry(docx, "[Content_Types].xml")).toContain("wordprocessingml.document.main+xml");
  });
});

describe("PDF to Word: sideways pages", () => {
  it("turns text running down the page so it reads left to right", async () => {
    const { turnUpright } = await import("./pdf-word");
    // A 400 × 600 page whose text runs downwards (reading angle 270°).
    const words = ["First", "line", "here"].map((text, i) => ({
      text,
      x: 50,
      y: 500 - i * 40,
      width: 30,
      size: 11,
      bold: false,
      italic: false,
      angle: 270,
    }));
    const page = turnUpright(400, 600, words);
    expect([page.width, page.height]).toEqual([600, 400]);
    expect(page.items.map((i) => i.y)).toEqual([50, 50, 50]);
    expect(page.items.map((i) => i.x)).toEqual([100, 140, 180]);
    const [block] = pageBlocks(page, 11);
    expect(block.runs[0].text).toBe("First line here");
  });
});

describe("Word to PDF: portable bullets", () => {
  it("swaps Symbol and Wingdings bullets for standard characters", async () => {
    const { portableBullets } = await import("./pdf-word");
    const css = 'p.a:before {\n  content: "\\9";\n  font-family: Symbol;\n}\np.b:before { content: ""; font-family: Wingdings; }\np.c:before { content: "o"; font-family: Courier New; }';
    const out = portableBullets(css);
    expect(out).toContain('content: "•\\9"');
    expect(out).toContain('content: "▪"');
    expect(out).not.toMatch(/Symbol|Wingdings/);
    expect(out).toContain("font-family: Courier New");
  });
});

describe("Word to PDF: pages to PDF", () => {
  it("puts each page picture in a PDF with an invisible, searchable text layer", async () => {
    const { pagesToPdf } = await import("./docx-pdf");
    // Smallest valid JPEG: 1 × 1 white pixel.
    const jpeg = Uint8Array.from(
      atob(
        "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
      ),
      (c) => c.charCodeAt(0),
    );
    const r = await pagesToPdf(
      [
        { jpeg, width: 612, height: 792, words: [{ text: "Quarterly", x: 72, y: 72, width: 60, height: 14 }, { text: "नमस्ते", x: 140, y: 72, width: 40, height: 14 }] },
        { jpeg, width: 612, height: 792, words: [] },
      ],
      "report.docx",
    );
    expect(r).toMatchObject({ name: "report.pdf", pageCount: 2, searchable: 50 });
    const out = await PDFDocument.load(r.data);
    expect(out.getPages().map((p) => [p.getWidth(), p.getHeight()])).toEqual([[612, 792], [612, 792]]);
    await expect(pagesToPdf([], "x.docx")).rejects.toThrow("no pages");
  });
});
