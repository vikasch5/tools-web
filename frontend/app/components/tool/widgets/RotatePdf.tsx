import { useEffect, useState } from "react";
import { FileText, LoaderCircle, RotateCcw, RotateCw, Undo2, X } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import type { PdfFile } from "~/tools/engine/pdf";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { MAX_PDF_BYTES, PDF_ACCEPT, pdfBlob, toPdfFile } from "./pdf-shared";
import { usePdfDocument } from "./usePdfDocument";

type Status = { tone: "idle" | "success" | "error"; text: string };
const IDLE: Status = { tone: "idle", text: "Your PDF stays on your device." };

export function RotatePdf() {
  const [doc, setDoc] = useState<{ file: File; pdf: PdfFile } | null>(null);
  const [turns, setTurns] = useState<number[]>([]);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<Status>(IDLE);
  const { pdf, thumbs, error } = usePdfDocument(doc?.pdf.data ?? null);

  useEffect(() => warmUpWorker(), []);
  useEffect(() => {
    if (pdf) setTurns(Array(pdf.numPages).fill(0));
  }, [pdf]);
  useEffect(() => {
    if (error) {
      setDoc(null);
      setStatus({ tone: "error", text: error });
    }
  }, [error]);

  const open = async ([file]: File[]) => {
    setStatus(IDLE);
    setDoc({ file, pdf: await toPdfFile(file) });
  };

  const turn = (index: number | "all", by: number) =>
    setTurns((list) => list.map((t, i) => (index === "all" || i === index ? t + by : t)));

  const changed = turns.filter((t) => t % 360 !== 0).length;

  const save = async () => {
    if (!doc) return;
    setWorking(true);
    const r = await runTaskInWorker({ type: "pdf-rotate", file: doc.pdf, turns });
    setWorking(false);
    if (!r.ok) return setStatus({ tone: "error", text: r.message });
    downloadBlob(pdfBlob(r.value.data), r.value.name);
    setStatus({ tone: "success", text: `Saved ${r.value.name} (${formatBytes(r.value.data.length)}).` });
  };

  if (!doc || !pdf)
    return (
      <Panel
        status={
          doc ? (
            <StatusMessage tone="working">Opening…</StatusMessage>
          ) : (
            <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
          )
        }
      >
        <div className="p-4 sm:p-6">
          <FileDrop
            accept={PDF_ACCEPT}
            maxBytes={MAX_PDF_BYTES}
            title="Drop a PDF here"
            hint="Up to 100 MB."
            onFiles={open}
            onReject={(text) => setStatus({ tone: "error", text })}
          />
        </div>
      </Panel>
    );

  return (
    <Panel
      toolbar={
        <>
          <Button variant="primary" size="sm" onClick={save} disabled={working || changed === 0}>
            {working && <LoaderCircle aria-hidden size={15} className="animate-spin" />}
            Save rotated PDF
          </Button>
          <div className="flex items-center gap-1.5">
            <Button size="sm" icon={RotateCcw} onClick={() => turn("all", -90)}>
              All left
            </Button>
            <Button size="sm" icon={RotateCw} onClick={() => turn("all", 90)}>
              All right
            </Button>
            <Button size="sm" variant="ghost" icon={Undo2} onClick={() => setTurns((l) => l.map(() => 0))} disabled={changed === 0}>
              Reset
            </Button>
          </div>
        </>
      }
      status={
        working ? (
          <StatusMessage tone="working">Saving…</StatusMessage>
        ) : status.tone !== "idle" ? (
          <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
        ) : (
          <StatusMessage tone="idle">
            {changed === 0
              ? "Rotate pages with the buttons under each preview, or rotate them all at once."
              : `${changed} of ${pdf.numPages} ${pdf.numPages === 1 ? "page" : "pages"} will be rotated.`}
          </StatusMessage>
        )
      }
    >
      <PanelSection
        title="Document"
        actions={
          <IconButton
            icon={X}
            label="Remove PDF"
            size="sm"
            onClick={() => {
              setDoc(null);
              setStatus(IDLE);
            }}
          />
        }
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-cat-pdf-soft text-cat-pdf">
            <FileText aria-hidden size={18} strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{doc.file.name}</p>
            <p className="text-xs text-fg-muted">
              {pdf.numPages} {pdf.numPages === 1 ? "page" : "pages"} · {formatBytes(doc.file.size)}
            </p>
          </div>
        </div>
      </PanelSection>
      <ol className="grid grid-cols-2 gap-3 border-t border-border p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {turns.map((t, i) => {
          const angle = ((t % 360) + 360) % 360;
          return (
            <li key={i} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface-2/40 p-2">
              <div className="flex aspect-square w-full items-center justify-center overflow-hidden">
                {thumbs[i] ? (
                  <img
                    src={thumbs[i]}
                    alt={`Page ${i + 1}${angle ? `, turned ${angle}° clockwise` : ""}`}
                    style={{ transform: `rotate(${t}deg)` }}
                    className="max-h-[78%] max-w-[78%] bg-surface shadow-sm ring-1 ring-border motion-safe:transition-transform motion-safe:duration-200"
                  />
                ) : (
                  <LoaderCircle aria-label={`Loading page ${i + 1}`} size={18} className="animate-spin text-fg-subtle" />
                )}
              </div>
              <div className="flex w-full items-center justify-between gap-1">
                <IconButton icon={RotateCcw} label={`Rotate page ${i + 1} left`} size="sm" onClick={() => turn(i, -90)} />
                <span className="text-xs tabular-nums text-fg-muted">
                  {i + 1}
                  {angle !== 0 && <span className="font-medium text-fg"> · {angle}°</span>}
                </span>
                <IconButton icon={RotateCw} label={`Rotate page ${i + 1} right`} size="sm" onClick={() => turn(i, 90)} />
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
