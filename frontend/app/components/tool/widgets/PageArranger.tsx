import { useEffect, useState, type DragEvent } from "react";
import { ArrowLeft, ArrowRight, LoaderCircle, RotateCw, Trash2, Undo2, X } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { TextField } from "~/components/ui/Field";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import { formatPageRanges, parsePageRanges } from "~/tools/engine/page-ranges";
import type { PdfFile } from "~/tools/engine/pdf";
import { normalizeAngle, type PagePlan } from "~/tools/engine/pdf-pages";
import { cn } from "~/lib/cn";
import { Panel, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { pdfBlob, toPdfFile } from "./pdf-shared";
import { usePdfDocument } from "./usePdfDocument";
import { FileSummary, PdfDropPanel, pageWord, type Status } from "./PdfChrome";

const IDLE: Status = { tone: "idle", text: "Your PDF stays on your device." };

/** Opening a PDF and drawing its previews, shared by both panels. */
function usePdfPages() {
  const [doc, setDoc] = useState<{ file: File; pdf: PdfFile } | null>(null);
  const [status, setStatus] = useState<Status>(IDLE);
  const [working, setWorking] = useState(false);
  const { pdf, thumbs, error } = usePdfDocument(doc?.pdf.data ?? null);

  useEffect(() => warmUpWorker(), []);
  useEffect(() => {
    if (error) {
      setDoc(null);
      setStatus({ tone: "error", text: error });
    }
  }, [error]);

  const open = async (file: File) => {
    setStatus(IDLE);
    setDoc({ file, pdf: await toPdfFile(file) });
  };
  const close = () => {
    setDoc(null);
    setStatus(IDLE);
  };

  const save = async (plan: PagePlan[], suffix: string) => {
    if (!doc) return;
    setWorking(true);
    const r = await runTaskInWorker({ type: "pdf-arrange", file: doc.pdf, plan, suffix });
    setWorking(false);
    if (!r.ok) return setStatus({ tone: "error", text: r.message });
    downloadBlob(pdfBlob(r.value.data), r.value.name);
    setStatus({
      tone: "success",
      text: `Saved ${r.value.name} with ${pageWord(r.value.pageCount)} (${formatBytes(r.value.data.length)}).`,
    });
  };

  return { doc, pdf, thumbs, status, setStatus, working, open, close, save };
}

function Thumb({ src, page, turn = 0, faded = false }: { src?: string; page: number; turn?: number; faded?: boolean }) {
  return (
    <div className="flex aspect-square w-full items-center justify-center overflow-hidden">
      {src ? (
        <img
          src={src}
          alt={`Page ${page}`}
          draggable={false}
          style={{ transform: `rotate(${turn}deg)` }}
          className={cn(
            "max-h-[78%] max-w-[78%] bg-surface shadow-sm ring-1 ring-border motion-safe:transition-[transform,opacity] motion-safe:duration-200",
            faded && "opacity-35",
          )}
        />
      ) : (
        <LoaderCircle aria-label={`Loading page ${page}`} size={18} className="animate-spin text-fg-subtle" />
      )}
    </div>
  );
}

const grid = "grid grid-cols-2 gap-3 border-t border-border p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

type Item = { key: number; index: number; turn: number };

export function OrganizePdf() {
  const { doc, pdf, thumbs, status, setStatus, working, open, close, save } = usePdfPages();
  const [items, setItems] = useState<Item[]>([]);
  const [dragKey, setDragKey] = useState<number | null>(null);

  const reset = () => {
    if (pdf) setItems(Array.from({ length: pdf.numPages }, (_, i) => ({ key: i, index: i, turn: 0 })));
  };
  useEffect(reset, [pdf]);

  if (!doc || !pdf)
    return <PdfDropPanel status={status} opening={!!doc} onFile={open} onReject={(text) => setStatus({ tone: "error", text })} />;

  const announce = (text: string) => setStatus({ tone: "idle", text });
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setItems(next);
    announce(`Moved page ${item.index + 1} to position ${to + 1}.`);
  };
  const remove = (at: number) => {
    const item = items[at];
    setItems(items.filter((_, i) => i !== at));
    announce(`Removed page ${item.index + 1}. Reset brings it back.`);
  };
  const turn = (at: number) =>
    setItems(items.map((item, i) => (i === at ? { ...item, turn: item.turn + 90 } : item)));

  const changed =
    items.length !== pdf.numPages || items.some((item, i) => item.index !== i || normalizeAngle(item.turn) !== 0);

  const onDrop = (event: DragEvent, at: number) => {
    event.preventDefault();
    if (dragKey === null) return;
    move(items.findIndex((i) => i.key === dragKey), at);
    setDragKey(null);
  };

  return (
    <Panel
      toolbar={
        <>
          <Button
            variant="primary"
            size="sm"
            onClick={() => save(items.map(({ index, turn }) => ({ index, turn })), "organized")}
            disabled={working || !changed || items.length === 0}
          >
            {working && <LoaderCircle aria-hidden size={15} className="animate-spin" />}
            Save organized PDF
          </Button>
          <Button size="sm" variant="ghost" icon={Undo2} onClick={reset} disabled={!changed}>
            Reset
          </Button>
        </>
      }
      status={
        working ? (
          <StatusMessage tone="working">Saving…</StatusMessage>
        ) : (
          <StatusMessage tone={status.tone}>
            {status === IDLE
              ? "Drag pages to reorder them, or use the arrows. Turn or remove pages with the buttons."
              : status.text}
          </StatusMessage>
        )
      }
    >
      <FileSummary
        file={doc.file}
        detail={items.length === pdf.numPages ? pageWord(pdf.numPages) : `${items.length} of ${pageWord(pdf.numPages)} kept`}
        onRemove={close}
      />
      {items.length === 0 ? (
        <p className="border-t border-border p-6 text-center text-sm text-fg-muted">
          Every page has been removed. Press Reset to start again.
        </p>
      ) : (
        <ol className={grid}>
          {items.map((item, at) => (
            <li
              key={item.key}
              draggable
              onDragStart={(event) => {
                setDragKey(item.key);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDragKey(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(event, at)}
              aria-label={`Position ${at + 1}: page ${item.index + 1}`}
              className={cn(
                "flex cursor-grab flex-col items-center gap-2 rounded-lg border border-border bg-surface-2/40 p-2 active:cursor-grabbing",
                dragKey === item.key && "opacity-50",
              )}
            >
              <Thumb src={thumbs[item.index]} page={item.index + 1} turn={item.turn} />
              <span className="text-xs tabular-nums text-fg-muted">
                Page {item.index + 1}
                {normalizeAngle(item.turn) !== 0 && <span className="font-medium text-fg"> · {normalizeAngle(item.turn)}°</span>}
              </span>
              <div className="flex w-full items-center justify-between">
                <IconButton icon={ArrowLeft} label={`Move page ${item.index + 1} earlier`} size="sm" onClick={() => move(at, at - 1)} disabled={at === 0} />
                <IconButton icon={RotateCw} label={`Turn page ${item.index + 1} right`} size="sm" onClick={() => turn(at)} />
                <IconButton icon={Trash2} label={`Remove page ${item.index + 1}`} size="sm" onClick={() => remove(at)} />
                <IconButton
                  icon={ArrowRight}
                  label={`Move page ${item.index + 1} later`}
                  size="sm"
                  onClick={() => move(at, at + 1)}
                  disabled={at === items.length - 1}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export function DeletePdfPages() {
  const { doc, pdf, thumbs, status, setStatus, working, open, close, save } = usePdfPages();
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState("");

  useEffect(() => {
    setMarked(new Set());
    setDraft("");
    setDraftError("");
  }, [pdf]);

  if (!doc || !pdf)
    return <PdfDropPanel status={status} opening={!!doc} onFile={open} onReject={(text) => setStatus({ tone: "error", text })} />;

  const count = pdf.numPages;
  const apply = (next: Set<number>) => {
    setMarked(next);
    setDraft(formatPageRanges(next));
    setDraftError("");
  };
  const toggle = (index: number) => {
    const next = new Set(marked);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    apply(next);
  };
  const type = (value: string) => {
    setDraft(value);
    if (!value.trim()) {
      setMarked(new Set());
      return setDraftError("");
    }
    try {
      setMarked(new Set(parsePageRanges(value, count).flat()));
      setDraftError("");
    } catch (error) {
      setDraftError((error as Error).message);
    }
  };

  const keep = Array.from({ length: count }, (_, i) => i).filter((i) => !marked.has(i));
  const problem = draftError || (keep.length === 0 ? "That would remove every page. Keep at least one." : "");

  return (
    <Panel
      toolbar={
        <>
          <Button
            variant="primary"
            size="sm"
            onClick={() => save(keep.map((index) => ({ index, turn: 0 })), "pages-removed")}
            disabled={working || marked.size === 0 || !!problem}
          >
            {working && <LoaderCircle aria-hidden size={15} className="animate-spin" />}
            Delete pages and download
          </Button>
          <Button size="sm" variant="ghost" icon={Undo2} onClick={() => apply(new Set())} disabled={marked.size === 0}>
            Clear selection
          </Button>
        </>
      }
      status={
        working ? (
          <StatusMessage tone="working">Saving…</StatusMessage>
        ) : problem ? (
          <StatusMessage tone="error">{problem}</StatusMessage>
        ) : status !== IDLE ? (
          <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
        ) : (
          <StatusMessage tone="idle">
            {marked.size === 0
              ? "Click the pages to delete, or type them below."
              : `${pageWord(marked.size)} will be deleted; ${pageWord(keep.length)} will remain.`}
          </StatusMessage>
        )
      }
    >
      <FileSummary file={doc.file} detail={pageWord(count)} onRemove={close}>
        <div className="border-t border-border p-4">
          <TextField
            label="Pages to delete"
            hint={`1–${count}`}
            value={draft}
            onChange={(event) => type(event.target.value)}
            placeholder="e.g. 2, 5-7"
            spellCheck={false}
            aria-invalid={draftError ? true : undefined}
            className="max-w-md font-mono"
          />
        </div>
      </FileSummary>
      <ol className={grid}>
        {Array.from({ length: count }, (_, i) => {
          const on = marked.has(i);
          return (
            <li key={i}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={`Page ${i + 1}${on ? ", will be deleted" : ""}`}
                onClick={() => toggle(i)}
                className={cn(
                  "relative flex w-full flex-col items-center gap-2 rounded-lg border p-2 transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-ring",
                  on ? "border-danger bg-danger-soft" : "border-border bg-surface-2/40 hover:border-border-strong",
                )}
              >
                <Thumb src={thumbs[i]} page={i + 1} faded={on} />
                {on && (
                  <span aria-hidden className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full bg-danger text-white">
                    <X size={14} strokeWidth={2.5} />
                  </span>
                )}
                <span className={cn("text-xs tabular-nums", on ? "font-medium text-danger" : "text-fg-muted")}>
                  {i + 1}
                  {on && " · delete"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
