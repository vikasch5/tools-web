import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { canvasToBlob, openPdfForRendering, renderPdfPage } from "./pdf-render";

const THUMB_WIDTH = 180;

/**
 * Opens a PDF for drawing and renders small page previews one after
 * another, so the first pages appear quickly even in long documents.
 * Previews are object URLs, revoked when the document changes.
 */
export function usePdfDocument(data: Uint8Array | null) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    const urls: string[] = [];
    let opened: PDFDocumentProxy | null = null;
    setPdf(null);
    setThumbs([]);
    setError("");
    (async () => {
      try {
        opened = await openPdfForRendering(data);
        if (cancelled) return;
        setPdf(opened);
        for (let n = 1; n <= opened.numPages && !cancelled; n++) {
          const first = await opened.getPage(n);
          const scale = THUMB_WIDTH / first.getViewport({ scale: 1 }).width;
          const canvas = await renderPdfPage(opened, n, scale);
          const url = URL.createObjectURL(await canvasToBlob(canvas, "image/jpeg", 0.8));
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          urls.push(url);
          setThumbs([...urls]);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
      void opened?.loadingTask.destroy();
    };
  }, [data]);

  return { pdf, thumbs, error };
}
