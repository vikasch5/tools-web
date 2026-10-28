import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";

/** Displayed size of a page in points (after its own rotation), for proportional overlays. */
export function usePageSize(pdf: PDFDocumentProxy | null, pageNumber: number) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    if (!pdf || pageNumber < 1 || pageNumber > pdf.numPages) return;
    let cancelled = false;
    void pdf.getPage(pageNumber).then((page) => {
      const { width, height } = page.getViewport({ scale: 1 });
      if (!cancelled) setSize({ width, height });
    });
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);
  return size;
}

/**
 * A page preview with an overlay drawn in page units: children are
 * positioned in percentages of the page, and `cqw` font sizes scale with it.
 */
export function PagePreview({
  src,
  size,
  label,
  children,
  caption,
}: {
  src?: string;
  /** Displayed page size in points; sets the preview's shape. */
  size: { width: number; height: number } | null;
  label: string;
  children?: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <figure className="flex flex-col items-center gap-2">
      <div className="flex h-72 w-full items-center justify-center rounded-lg bg-surface-2/60 p-4 sm:h-80">
        {src && size ? (
          // The box takes the page's shape (fitting the frame either way), so
          // overlays can use percentages and cqw font sizes.
          <div
            className="relative max-h-full max-w-full"
            style={{
              aspectRatio: `${size.width} / ${size.height}`,
              [size.width > size.height ? "width" : "height"]: "100%",
              containerType: "inline-size",
            }}
          >
            <img src={src} alt={label} className="absolute inset-0 size-full bg-surface shadow-sm ring-1 ring-border" />
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              {children}
            </div>
          </div>
        ) : (
          <LoaderCircle aria-label="Loading preview" size={20} className="animate-spin text-fg-subtle" />
        )}
      </div>
      {caption && <figcaption className="text-xs text-fg-muted">{caption}</figcaption>}
    </figure>
  );
}
