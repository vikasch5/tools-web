import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "~/components/ui/Button";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { bodyTextSize, describeBlocks, DOCX_TYPE, textToWordPages, turnUpright, type TextItem, type TextPage } from "~/tools/engine/pdf-word";
import { pdfBaseName } from "~/tools/engine/pdf";
import { Panel, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { pdfBlob } from "./pdf-shared";
import { openPdfForRendering } from "./pdf-render";
import { FileSummary, PdfDropPanel, pageWord, type Status } from "./PdfChrome";

const IDLE: Status = { tone: "idle", text: "Your PDF stays on your device." };

/**
 * Reads the positioned text of each page. Font names (and so bold and
 * italic) are only known once a page's drawing operations are loaded.
 */
async function readText(pdf: PDFDocumentProxy, onPage: (n: number) => void): Promise<TextPage[]> {
  const pages: TextPage[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    onPage(n);
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: 1 });
    await page.getOperatorList();
    const content = await page.getTextContent();
    const fontStyle = new Map<string, { bold: boolean; italic: boolean }>();
    const styleOf = (fontName: string) => {
      let style = fontStyle.get(fontName);
      if (!style) {
        let name = "";
        try {
          const font = page.commonObjs.get(fontName) as { name?: string; bold?: boolean; italic?: boolean } | undefined;
          name = font?.name ?? "";
          style = { bold: !!font?.bold || /bold|black|heavy|semibold|demi/i.test(name), italic: !!font?.italic || /italic|oblique/i.test(name) };
        } catch {
          style = { bold: false, italic: false };
        }
        fontStyle.set(fontName, style);
      }
      return style;
    };
    const items: (TextItem & { angle: number })[] = [];
    const [va, vb, vc, vd] = viewport.transform;
    for (const raw of content.items) {
      if (!("str" in raw) || !raw.str) continue;
      // Positions on the displayed page (y up), and the reading direction there.
      const [a, b, , , e, f] = raw.transform as number[];
      const [x, yTop] = viewport.convertToViewportPoint(e, f);
      const dx = va * a + vc * b;
      const dy = vb * a + vd * b;
      const size = Math.hypot(a, b) || raw.height || 10;
      items.push({
        text: raw.str,
        x,
        y: viewport.height - yTop,
        width: raw.width,
        size: Math.round(size * 10) / 10,
        angle: (Math.atan2(-dy, dx) * 180) / Math.PI,
        ...styleOf(raw.fontName),
      });
    }
    pages.push(turnUpright(viewport.width, viewport.height, items));
    page.cleanup();
  }
  return pages;
}

export function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [status, setStatus] = useState<Status>(IDLE);
  const [opening, setOpening] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  useEffect(() => warmUpWorker(), []);
  useEffect(() => () => void pdf?.loadingTask.destroy(), [pdf]);

  if (!file || !pdf)
    return (
      <PdfDropPanel
        status={status}
        opening={opening}
        onFile={async (f) => {
          setOpening(true);
          setStatus(IDLE);
          try {
            setPdf(await openPdfForRendering(new Uint8Array(await f.arrayBuffer())));
            setFile(f);
          } catch (e) {
            setStatus({ tone: "error", text: (e as Error).message });
          }
          setOpening(false);
        }}
        onReject={(text) => setStatus({ tone: "error", text })}
      />
    );

  const convert = async () => {
    try {
      const textPages = await readText(pdf, (n) => setProgress(`Reading page ${n} of ${pdf.numPages}…`));
      const pages = textToWordPages(textPages);
      setProgress("Writing the Word file…");
      const r = await runTaskInWorker({ type: "docx-build", pages, bodySize: bodyTextSize(textPages) });
      setProgress(null);
      if (!r.ok) return setStatus({ tone: "error", text: r.message });
      const name = `${pdfBaseName(file.name)}.docx`;
      downloadBlob(pdfBlob(r.value, DOCX_TYPE), name);
      setStatus({ tone: "success", text: `Saved ${name} (${formatBytes(r.value.length)}): ${describeBlocks(pages)}.` });
    } catch (e) {
      setProgress(null);
      setStatus({ tone: "error", text: (e as Error).message });
    }
  };

  return (
    <Panel
      toolbar={
        <Button variant="primary" size="sm" onClick={convert} disabled={progress !== null}>
          {progress !== null && <LoaderCircle aria-hidden size={15} className="animate-spin" />}
          Convert to Word
        </Button>
      }
      status={
        progress ? (
          <StatusMessage tone="working">{progress}</StatusMessage>
        ) : (
          <StatusMessage tone={status.tone}>
            {status === IDLE
              ? "The text, headings, paragraphs and lists are converted. Layout, images and tables are not kept."
              : status.text}
          </StatusMessage>
        )
      }
    >
      <FileSummary
        file={file}
        detail={pageWord(pdf.numPages)}
        onRemove={() => {
          setFile(null);
          setPdf(null);
          setStatus(IDLE);
        }}
      />
    </Panel>
  );
}
