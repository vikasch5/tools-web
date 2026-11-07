import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { runTaskInWorker } from "~/tools/engine/client";
import type { Business, InvoiceDoc } from "~/tools/engine/invoice";
import { pdfBlob } from "../pdf-shared";
import { canvasToBlob, openPdfForRendering, renderPdfPage } from "../pdf-render";
import { StatusMessage } from "../../Panel";

/** A4 is 595 points wide; this keeps text sharp on high-density screens. */
const RENDER_SCALE = 2;
/** Wait for a pause in typing before rebuilding the PDF. */
const DEBOUNCE_MS = 450;

export async function makePdf(doc: InvoiceDoc, business: Business, draft = false) {
  const r = await runTaskInWorker({
    type: "invoice-pdf",
    input: { doc, branding: { logo: business.logo, signature: business.signature, template: doc.template ?? business.template, accent: doc.accent ?? business.accent }, draft },
  });
  if (!r.ok) throw new Error(r.message);
  return pdfBlob(r.value);
}

/** Shows the reader what goes where until each detail is filled in. */
const withPlaceholders = (doc: InvoiceDoc): InvoiceDoc => ({
  ...doc,
  seller: { ...doc.seller, name: doc.seller.name || "Your business name" },
  buyer: { ...doc.buyer, name: doc.buyer.name || "Customer name" },
  items: doc.items.map((item, i) => ({ ...item, name: item.name || `Item ${i + 1}` })),
});

/** The real PDF drawn page by page, so the preview always matches the download. */
export function InvoicePreview({ doc, business }: { doc: InvoiceDoc; business: Business }) {
  const [pages, setPages] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const shown = useRef<string[]>([]);

  // updatedAt changes on every save without changing what is printed.
  const key = JSON.stringify([{ ...doc, updatedAt: 0 }, business.logo, business.signature, business.template, business.accent]);

  useEffect(() => {
    let stale = false;
    setBusy(true);
    const timer = window.setTimeout(async () => {
      try {
        const bytes = new Uint8Array(await (await makePdf(withPlaceholders(doc), business, true)).arrayBuffer());
        if (stale) return;
        const pdf = await openPdfForRendering(bytes);
        const urls: string[] = [];
        for (let n = 1; n <= pdf.numPages && !stale; n++) {
          const canvas = await renderPdfPage(pdf, n, RENDER_SCALE);
          urls.push(URL.createObjectURL(await canvasToBlob(canvas, "image/png")));
        }
        void pdf.loadingTask.destroy();
        if (stale) {
          urls.forEach((u) => URL.revokeObjectURL(u));
          return;
        }
        shown.current.forEach((u) => URL.revokeObjectURL(u));
        shown.current = urls;
        setPages(urls);
        setError("");
        setBusy(false);
      } catch (e) {
        if (stale) return;
        setError((e as Error).message);
        setBusy(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      window.clearTimeout(timer);
    };
  }, [key]);

  useEffect(() => () => shown.current.forEach((u) => URL.revokeObjectURL(u)), []);

  return (
    <div className="space-y-3">
      <div className="flex min-h-5 items-center justify-between gap-3 text-xs text-fg-muted" aria-live="polite">
        <span>{pages.length > 0 ? `A4, ${pages.length} ${pages.length === 1 ? "page" : "pages"}` : "A4"}</span>
        {busy && (
          <span className="inline-flex items-center gap-1.5">
            <LoaderCircle aria-hidden size={13} className="animate-spin" />
            Updating…
          </span>
        )}
      </div>
      {error && <StatusMessage tone="error">{error}</StatusMessage>}
      {pages.length > 0 ? (
        pages.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Page ${i + 1} of ${pages.length} of the document`}
            className="mx-auto block aspect-[210/297] w-full rounded-sm bg-white shadow-md ring-1 ring-border"
          />
        ))
      ) : (
        <div className="mx-auto flex aspect-[210/297] w-full items-center justify-center rounded-sm bg-white text-sm text-neutral-500 shadow-md ring-1 ring-border">
          {error ? "Preview unavailable" : "Preparing preview…"}
        </div>
      )}
    </div>
  );
}
