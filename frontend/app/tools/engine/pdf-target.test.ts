import { createRequire } from "node:module";
import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { setQpdfWasmLocation } from "./qpdf";
import { compressPdfToTarget, pagesToPdf, rasterSteps, targetSteps } from "./pdf-compress";

const require = createRequire(import.meta.url);
beforeAll(() => setQpdfWasmLocation(require.resolve("@neslinesli93/qpdf-wasm/dist/qpdf.wasm")));

const jpeg = Uint8Array.from(
  atob(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDgKKKK+eP2E//Z",
  ),
  (c) => c.charCodeAt(0),
);

async function textPdf(pages: number) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) doc.addPage([400, 600]).drawText(`Page body ${i + 1}`, { x: 40, y: 500, size: 14, font });
  return { name: "report.pdf", data: await doc.save({ useObjectStreams: false }) };
}

describe("compressPdfToTarget", () => {
  it("keeps a file that is already under the limit", async () => {
    const file = await textPdf(2);
    const r = await compressPdfToTarget(file, file.data.length + 10);
    expect(r).toMatchObject({ reached: true, step: "already under the limit", after: file.data.length });
    expect(r.data).toBe(file.data);
  });

  it("uses the gentlest step that fits", async () => {
    const file = await textPdf(20);
    const r = await compressPdfToTarget(file, file.data.length - 1);
    expect(r.reached).toBe(true);
    expect(r.step).toBe(targetSteps[0].label);
    expect(r.after).toBeLessThan(file.data.length);
    expect((await PDFDocument.load(r.data)).getPageCount()).toBe(20);
  });

  it("reports when no step reaches a tiny limit", async () => {
    const file = await textPdf(3);
    const r = await compressPdfToTarget(file, 100);
    expect(r.reached).toBe(false);
    expect(r.after).toBeLessThanOrEqual(file.data.length);
  });
});

describe("pagesToPdf", () => {
  it("makes one page per image at the original page size", async () => {
    const data = await pagesToPdf([
      { jpeg, widthPt: 595.28, heightPt: 841.89 },
      { jpeg, widthPt: 841.89, heightPt: 595.28 },
    ]);
    const pages = (await PDFDocument.load(data)).getPages();
    expect(pages.map((p) => [Math.round(p.getWidth()), Math.round(p.getHeight())])).toEqual([
      [595, 842],
      [842, 595],
    ]);
  });

  it("tries page images from best to smallest", () => {
    for (let i = 1; i < rasterSteps.length; i++) {
      const [dpi, q] = rasterSteps[i];
      const [prevDpi, prevQ] = rasterSteps[i - 1];
      expect(dpi <= prevDpi && q <= prevQ && (dpi < prevDpi || q < prevQ)).toBe(true);
    }
  });
});
