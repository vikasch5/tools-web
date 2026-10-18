import type { PdfFile } from "~/tools/engine/pdf";

export const PDF_ACCEPT = [".pdf"];
export const MAX_PDF_BYTES = 100 * 1024 * 1024;

/** Reads a file into a fresh buffer (sent to the worker by copy). */
export async function toPdfFile(file: File): Promise<PdfFile> {
  return { name: file.name, data: new Uint8Array(await file.arrayBuffer()) };
}

export const pdfBlob = (data: Uint8Array, type = "application/pdf") =>
  new Blob([data as Uint8Array<ArrayBuffer>], { type });
