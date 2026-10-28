import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FileDown, LoaderCircle } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { describeWordLayout, portableBullets } from "~/tools/engine/pdf-word";
import { Panel, PanelSection, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { pdfBlob } from "./pdf-shared";
import { FileSummary, PdfDropPanel, pageWord, type Status } from "./PdfChrome";
import { hasSavedPageBreaks, paginate, renderPages } from "./docx-pages";

const IDLE: Status = { tone: "idle", text: "Your document stays on your device." };
const DOCX_ACCEPT = [".docx"];
/** 2 × 96 = 192 DPI: sharp on screen and in print, at a reasonable file size. */
const SCALE = 2;

/**
 * The site's base styles reset images and tables; restore what Word
 * documents expect, and frame the pages in the preview.
 */
const HOST_CSS = `
.docx-host img, .docx-host svg, .docx-host video { display: inline; max-width: none; }
.docx-host table { border-collapse: collapse; }
.docx-host section.docx { overflow: hidden; }
.docx-stage .docx-wrapper { background: none; padding: 0; display: block; }
.docx-stage .docx-wrapper > section.docx { box-shadow: none; margin: 0; }
.docx-preview .docx-wrapper { background: var(--surface-2); padding: 24px; }
.docx-preview .docx-wrapper > section.docx { box-shadow: var(--shadow-md); margin-bottom: 24px; }
`;

export function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>(IDLE);
  const [laying, setLaying] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  // Off-screen, unscaled copy used for measuring and drawing pages.
  const source = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const pages = useRef<HTMLElement[]>([]);

  useEffect(() => warmUpWorker(), []);

  // Lay the document out into pages whenever a new file is chosen.
  useEffect(() => {
    if (!file || !source.current || !stage.current || !preview.current) return;
    let cancelled = false;
    const [src, stg, view] = [source.current, stage.current, preview.current];
    setLaying(true);
    setPageCount(0);
    (async () => {
      try {
        const { renderAsync } = await import("docx-preview");
        src.replaceChildren();
        await renderAsync(file, src, src, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          useBase64URL: true,
          renderComments: false,
          renderChanges: false,
        });
        if (cancelled) return;
        for (const style of src.querySelectorAll("style")) style.textContent = portableBullets(style.textContent ?? "");
        // Let fonts and images settle before measuring.
        await document.fonts?.ready;
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        if (cancelled) return;
        const saved = hasSavedPageBreaks(src);
        pages.current = paginate(src, stg);
        view.replaceChildren(stg.firstElementChild!.cloneNode(true));
        setPageCount(pages.current.length);
        setStatus(
          saved
            ? { tone: "idle", text: `Ready: ${pageWord(pages.current.length)}. ${describeWordLayout(true)}.` }
            : {
                tone: "warning",
                text: `Ready: ${pageWord(pages.current.length)}. This file has no saved page layout. ${describeWordLayout(false)}.`,
              },
        );
      } catch {
        if (cancelled) return;
        setFile(null);
        setStatus({
          tone: "error",
          text: "This file could not be read as a Word document. Only .docx files work; save old .doc files as .docx first.",
        });
      } finally {
        if (!cancelled) setLaying(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  // Scale the preview so a whole page width fits the panel.
  useLayoutEffect(() => {
    if (!pageCount || !frame.current || !pages.current[0]) return;
    const width = pages.current[0].offsetWidth;
    const fit = () => setZoom(Math.min(1, frame.current!.clientWidth / (width + 48)));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, [pageCount]);

  const convert = async () => {
    if (!file || !pages.current.length) return;
    try {
      const rendered = await renderPages(pages.current, SCALE, (n) =>
        setProgress(`Drawing page ${n} of ${pages.current.length}…`),
      );
      setProgress("Writing the PDF…");
      const r = await runTaskInWorker({ type: "docx-pdf", pages: rendered, name: file.name });
      setProgress(null);
      if (!r.ok) return setStatus({ tone: "error", text: r.message });
      downloadBlob(pdfBlob(r.value.data), r.value.name);
      setStatus({
        tone: "success",
        text: `Saved ${r.value.name}: ${pageWord(r.value.pageCount)}, ${formatBytes(r.value.data.length)}.`,
      });
    } catch {
      setProgress(null);
      setStatus({ tone: "error", text: "The pages could not be drawn. Try again, or reload the page if it keeps failing." });
    }
  };

  const busy = laying || progress !== null;

  return (
    <>
      <style>{HOST_CSS}</style>
      {/* Must be laid out (not hidden) to be measured and drawn, so it sits off-screen. */}
      <div aria-hidden className="pointer-events-none fixed top-0 -left-[100000px]">
        <div ref={source} className="docx-host" />
        <div ref={stage} className="docx-host docx-stage" />
      </div>
      {!file ? (
        <PdfDropPanel
          status={status}
          accept={DOCX_ACCEPT}
          title="Drop a Word document here"
          hint=".docx, up to 100 MB."
          onFile={(f) => {
            setStatus(IDLE);
            setFile(f);
          }}
          onReject={(text) => setStatus({ tone: "error", text })}
        />
      ) : (
        <Panel
          toolbar={
            <Button variant="primary" size="sm" icon={progress ? undefined : FileDown} onClick={convert} disabled={busy || !pageCount}>
              {progress && <LoaderCircle aria-hidden size={15} className="animate-spin" />}
              Convert and download PDF
            </Button>
          }
          status={
            laying ? (
              <StatusMessage tone="working">Laying out the pages…</StatusMessage>
            ) : progress ? (
              <StatusMessage tone="working">{progress}</StatusMessage>
            ) : (
              <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
            )
          }
        >
          <FileSummary
            file={file}
            detail={pageCount ? pageWord(pageCount) : undefined}
            onRemove={() => {
              setFile(null);
              setPageCount(0);
              pages.current = [];
              setStatus(IDLE);
            }}
          />
          <PanelSection title="Preview" className="border-t border-border">
            <div ref={frame} className="relative max-h-[36rem] min-h-48 overflow-auto bg-surface-2">
              {laying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoaderCircle aria-label="Laying out the pages" size={20} className="animate-spin text-fg-subtle" />
                </div>
              )}
              <div ref={preview} className="docx-host docx-preview" style={{ zoom }} />
            </div>
          </PanelSection>
        </Panel>
      )}
    </>
  );
}
