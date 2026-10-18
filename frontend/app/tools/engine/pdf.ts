import { createZip } from "./zip";
import { parsePageRanges } from "./page-ranges";

export type PdfFile = { name: string; data: Uint8Array };

async function load(file: PdfFile) {
  const { PDFDocument } = await import("pdf-lib");
  try {
    return await PDFDocument.load(file.data, { updateMetadata: false });
  } catch (error) {
    const message = String((error as Error)?.message ?? error);
    if (/encrypt/i.test(message))
      throw new Error(`“${file.name}” is password-protected. Remove the password first, then try again.`);
    throw new Error(`“${file.name}” could not be read as a PDF. It may be damaged.`);
  }
}

export async function pdfPageCount(file: PdfFile) {
  return (await load(file)).getPageCount();
}

/** Copies every page of each file, in order, into one new PDF. */
export async function mergePdfs(files: PdfFile[]) {
  if (files.length < 2) throw new Error("Add at least two PDFs to merge.");
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create();
  for (const file of files) {
    const doc = await load(file);
    const pages = await out.copyPages(doc, doc.getPageIndices());
    for (const page of pages) out.addPage(page);
  }
  return { data: await out.save(), pageCount: out.getPageCount() };
}

export type SplitMode = "extract" | "ranges" | "every";

const baseName = (name: string) => name.replace(/\.pdf$/i, "") || "document";

/**
 * extract: chosen pages into one PDF · ranges: one PDF per range ·
 * every: one PDF per page. Several outputs are bundled into a ZIP.
 */
export async function splitPdf(file: PdfFile, mode: SplitMode, ranges: string) {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await load(file);
  const count = doc.getPageCount();
  const groups =
    mode === "every"
      ? doc.getPageIndices().map((i) => [i])
      : mode === "extract"
        ? [parsePageRanges(ranges, count).flat()]
        : parsePageRanges(ranges, count);

  const base = baseName(file.name);
  const outputs: PdfFile[] = [];
  for (const group of groups) {
    const out = await PDFDocument.create();
    for (const page of await out.copyPages(doc, group)) out.addPage(page);
    const label =
      mode === "extract"
        ? "extract"
        : group.length === 1
          ? `page-${group[0] + 1}`
          : `pages-${group[0] + 1}-${group[group.length - 1] + 1}`;
    outputs.push({ name: `${base}-${label}.pdf`, data: await out.save() });
  }
  if (outputs.length === 1)
    return { name: outputs[0].name, data: outputs[0].data, files: 1, type: "application/pdf" };
  return { name: `${base}-split.zip`, data: createZip(outputs), files: outputs.length, type: "application/zip" };
}
