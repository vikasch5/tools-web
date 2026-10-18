import type { PDFDocumentProxy } from "pdfjs-dist";

/**
 * Opens a PDF with pdf.js for drawing pages. pdf.js parses in its own
 * worker; its font and decoder data are served from /pdfjs/ (see
 * vite.config.ts). Browser only.
 */
export async function openPdfForRendering(data: Uint8Array): Promise<PDFDocumentProxy> {
  const [pdfjs, worker] = await Promise.all([
    // The legacy build polyfills recent JavaScript (such as
    // Map.getOrInsertComputed) that many browsers in use still lack.
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  try {
    return await pdfjs.getDocument({
      // pdf.js takes ownership of the buffer it is given.
      data: data.slice(),
      cMapUrl: "/pdfjs/cmaps/",
      standardFontDataUrl: "/pdfjs/standard_fonts/",
      wasmUrl: "/pdfjs/wasm/",
      iccUrl: "/pdfjs/iccs/",
    }).promise;
  } catch (error) {
    if ((error as Error)?.name === "PasswordException")
      throw new Error("This PDF is password-protected. Remove the password first, then try again.");
    throw new Error("This file could not be read as a PDF. It may be damaged.");
  }
}

/**
 * Draws one page (1-based) at the given scale (1 = 72 DPI) on a canvas.
 * `extraRotation` is added to the page's own rotation, in degrees.
 */
export async function renderPdfPage(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale: number,
  { background = "#ffffff", extraRotation = 0 } = {},
) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale, rotation: (page.rotate + extraRotation) % 360 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  await page.render({ canvas, viewport, background }).promise;
  page.cleanup();
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The page image could not be saved."))), type, quality),
  );
}
