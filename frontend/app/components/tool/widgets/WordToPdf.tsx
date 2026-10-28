import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LoaderCircle, Printer } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { describeWordLayout, portableBullets } from "~/tools/engine/pdf-word";
import { Panel, PanelSection, StatusMessage } from "../Panel";
import { FileSummary, PdfDropPanel, pageWord, type Status } from "./PdfChrome";

const IDLE: Status = { tone: "idle", text: "Your document stays on your device." };
const DOCX_ACCEPT = [".docx"];

/**
 * The site's base styles reset images and tables; restore what Word
 * documents expect inside the preview and the printed copy.
 */
const HOST_CSS = `
.docx-host .docx-wrapper { background: var(--surface-2); padding: 24px; }
.docx-host .docx-wrapper > section.docx { box-shadow: var(--shadow-md); margin-bottom: 24px; }
.docx-host img, .docx-host svg, .docx-host video { display: inline; max-width: none; }
.docx-host table { border-collapse: collapse; }
`;

type Layout = {
  /** Page size and margins of the first section, as CSS lengths. */
  width: string;
  height: string;
  margins: [string, string, string, string];
  /** page: each section is one page, as Word laid it out. flow: the browser paginates. */
  mode: "page" | "flow";
  pages: number;
};

function measure(host: HTMLElement): Layout {
  const sections = [...host.querySelectorAll<HTMLElement>(".docx-wrapper > section.docx")];
  const first = sections[0];
  // A page box only has a minimum height, so it grows with its content. One
  // taller than the page size Word set means the file has no saved page
  // breaks, and the browser must split it into pages instead.
  const fits = sections.every((s) => {
    const probe = document.createElement("div");
    probe.style.height = s.style.minHeight || "11in";
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    s.parentElement!.appendChild(probe);
    const pageHeight = probe.getBoundingClientRect().height;
    probe.remove();
    return s.getBoundingClientRect().height <= pageHeight + 2;
  });
  return {
    width: first?.style.width || "8.5in",
    height: first?.style.minHeight || "11in",
    margins: [
      first?.style.paddingTop || "1in",
      first?.style.paddingRight || "1in",
      first?.style.paddingBottom || "1in",
      first?.style.paddingLeft || "1in",
    ],
    mode: fits ? "page" : "flow",
    pages: sections.length,
  };
}

function printCss(layout: Layout) {
  const page =
    layout.mode === "page"
      ? `@page { size: ${layout.width} ${layout.height}; margin: 0; }
#docx-print-root section.docx { break-after: page; overflow: visible; }`
      : `@page { size: ${layout.width} ${layout.height}; margin: ${layout.margins.join(" ")}; }
#docx-print-root section.docx { padding: 0 !important; min-height: 0 !important; width: auto !important; overflow: visible; }
#docx-print-root section.docx > header, #docx-print-root section.docx > footer { display: none; }
#docx-print-root section.docx + section.docx { break-before: page; }`;
  return `@media print {
html.docx-printing body > *:not(#docx-print-root) { display: none !important; }
html.docx-printing, html.docx-printing body { background: none !important; margin: 0 !important; padding: 0 !important; }
#docx-print-root .docx-wrapper { background: none !important; padding: 0 !important; display: block !important; }
#docx-print-root section.docx { box-shadow: none !important; margin: 0 !important; }
#docx-print-root section.docx:last-child { break-after: auto; }
${page}
}
@media screen { #docx-print-root { display: none; } }`;
}

export function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>(IDLE);
  const [rendering, setRendering] = useState(false);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [zoom, setZoom] = useState(1);
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  // Draw the document into the preview whenever a new file is chosen.
  useEffect(() => {
    if (!file || !host.current) return;
    let cancelled = false;
    const target = host.current;
    setRendering(true);
    setLayout(null);
    (async () => {
      try {
        const { renderAsync } = await import("docx-preview");
        target.replaceChildren();
        await renderAsync(file, target, target, {
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
        for (const style of target.querySelectorAll("style"))
          style.textContent = portableBullets(style.textContent ?? "");
        // Let web fonts and images settle before measuring the pages.
        await document.fonts?.ready;
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        if (cancelled) return;
        const measured = measure(target);
        setLayout(measured);
        setStatus(
          measured.mode === "page"
            ? { tone: "idle", text: `Ready: ${pageWord(measured.pages)}. ${describeWordLayout(true)}.` }
            // In flow mode the browser decides the page count when printing.
            : {
                tone: "warning",
                text: `This file has no saved page layout. ${describeWordLayout(false)}.`,
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
        if (!cancelled) setRendering(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  // Scale the preview so a whole page width fits the panel.
  useLayoutEffect(() => {
    if (!layout || !frame.current || !host.current) return;
    const page = host.current.querySelector<HTMLElement>(".docx-wrapper > section.docx");
    if (!page) return;
    const fit = () => {
      const available = frame.current!.clientWidth;
      setZoom(Math.min(1, available / (page.offsetWidth + 48)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, [layout]);

  const print = () => {
    if (!layout || !host.current || !file) return;
    const wrapper = host.current.querySelector(".docx-wrapper");
    if (!wrapper) return;
    const root = document.createElement("div");
    root.id = "docx-print-root";
    root.className = "docx-host";
    root.appendChild(wrapper.cloneNode(true));
    const style = document.createElement("style");
    style.textContent = printCss(layout);
    const title = document.title;
    // Browsers suggest the page title as the PDF's file name.
    document.title = file.name.replace(/\.docx$/i, "") || "document";
    document.head.appendChild(style);
    document.body.appendChild(root);
    document.documentElement.classList.add("docx-printing");
    const cleanup = () => {
      document.documentElement.classList.remove("docx-printing");
      root.remove();
      style.remove();
      document.title = title;
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    setStatus({
      tone: "idle",
      text: "In the print window, choose “Save as PDF” (or “Microsoft Print to PDF”) as the printer, then save.",
    });
  };

  if (!file)
    return (
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
    );

  return (
    <Panel
      toolbar={
        <Button variant="primary" size="sm" icon={Printer} onClick={print} disabled={rendering || !layout}>
          Save as PDF
        </Button>
      }
      status={
        rendering ? (
          <StatusMessage tone="working">Laying out the document…</StatusMessage>
        ) : (
          <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
        )
      }
    >
      <style>{HOST_CSS}</style>
      <FileSummary
        file={file}
        detail={layout?.mode === "page" ? pageWord(layout.pages) : undefined}
        onRemove={() => {
          setFile(null);
          setLayout(null);
          setStatus(IDLE);
        }}
      />
      <PanelSection title="Preview" className="border-t border-border">
        <div ref={frame} className="relative max-h-[36rem] min-h-48 overflow-auto bg-surface-2">
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoaderCircle aria-label="Laying out the document" size={20} className="animate-spin text-fg-subtle" />
            </div>
          )}
          <div ref={host} className="docx-host" style={{ zoom }} />
        </div>
      </PanelSection>
    </Panel>
  );
}
