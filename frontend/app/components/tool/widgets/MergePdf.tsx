import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, FileText, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { runTaskInWorker, warmUpWorker } from "~/tools/engine/client";
import type { PdfFile } from "~/tools/engine/pdf";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, StatusMessage, downloadBlob } from "../Panel";
import { formatBytes } from "../format";
import { MAX_PDF_BYTES, PDF_ACCEPT, pdfBlob, toPdfFile } from "./pdf-shared";

type Item = { id: number; file: File; pdf: PdfFile; pages: number | null; error?: string };

export function MergePdf() {
  const [items, setItems] = useState<Item[]>([]);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<{ tone: "idle" | "success" | "error" | "warning"; text: string }>({
    tone: "idle",
    text: "Add two or more PDFs, put them in order, then merge.",
  });
  const nextId = useRef(0);

  useEffect(() => warmUpWorker(), []);

  const add = async (files: File[]) => {
    const added: Item[] = [];
    for (const file of files) {
      const pdf = await toPdfFile(file);
      const r = await runTaskInWorker({ type: "pdf-count", file: pdf });
      added.push({
        id: nextId.current++,
        file,
        pdf,
        pages: r.ok ? r.value : null,
        ...(r.ok ? {} : { error: r.message }),
      });
    }
    setItems((list) => [...list, ...added]);
    const bad = added.find((a) => a.error);
    setStatus(bad ? { tone: "error", text: bad.error! } : { tone: "idle", text: "Ready to merge." });
  };

  const move = (index: number, by: number) =>
    setItems((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });

  const usable = items.filter((i) => !i.error);
  const totalPages = usable.reduce((n, i) => n + (i.pages ?? 0), 0);

  const merge = async () => {
    setWorking(true);
    const r = await runTaskInWorker({ type: "pdf-merge", files: usable.map((i) => i.pdf) });
    setWorking(false);
    if (!r.ok) {
      setStatus({ tone: "error", text: r.message });
      return;
    }
    downloadBlob(pdfBlob(r.value.data), "merged.pdf");
    setStatus({
      tone: "success",
      text: `Merged ${usable.length} files into merged.pdf: ${r.value.pageCount} pages, ${formatBytes(r.value.data.length)}.`,
    });
  };

  return (
    <Panel
      toolbar={
        <>
          <Button variant="primary" size="sm" onClick={merge} disabled={working || usable.length < 2}>
            {working && <LoaderCircle aria-hidden size={15} className="animate-spin" />}
            Merge and download
          </Button>
          {items.length > 0 && (
            <p className="text-sm text-fg-muted">
              {usable.length} {usable.length === 1 ? "file" : "files"} · {totalPages} pages
            </p>
          )}
          {items.length > 0 && (
            <div className="ml-auto">
              <Button size="sm" variant="ghost" onClick={() => setItems([])}>
                Clear all
              </Button>
            </div>
          )}
        </>
      }
      status={
        working ? (
          <StatusMessage tone="working">Merging…</StatusMessage>
        ) : (
          <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
        )
      }
    >
      <div className="p-4 sm:p-5">
        <FileDrop
          accept={PDF_ACCEPT}
          multiple
          compact={items.length > 0}
          maxBytes={MAX_PDF_BYTES}
          title={items.length ? "Add more PDFs" : "Drop PDF files here"}
          hint="Up to 100 MB each. Files are combined in the order listed."
          onFiles={add}
          onReject={(text) => setStatus({ tone: "error", text })}
        />
      </div>
      {items.length > 0 && (
        <PanelSection title="Order" className="border-t border-border">
          <ol className="divide-y divide-border">
            {items.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                <span className="w-6 shrink-0 text-right font-mono text-sm text-fg-subtle">{index + 1}</span>
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-cat-pdf-soft text-cat-pdf">
                  <FileText aria-hidden size={18} strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{item.file.name}</p>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {item.error ? (
                      <StatusMessage tone="error">{item.error} It will be skipped.</StatusMessage>
                    ) : (
                      `${item.pages} ${item.pages === 1 ? "page" : "pages"} · ${formatBytes(item.file.size)}`
                    )}
                  </p>
                </div>
                <IconButton
                  icon={ArrowUp}
                  label={`Move ${item.file.name} up`}
                  size="sm"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                />
                <IconButton
                  icon={ArrowDown}
                  label={`Move ${item.file.name} down`}
                  size="sm"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                />
                <IconButton
                  icon={Trash2}
                  label={`Remove ${item.file.name}`}
                  size="sm"
                  onClick={() => setItems((list) => list.filter((i) => i.id !== item.id))}
                />
              </li>
            ))}
          </ol>
        </PanelSection>
      )}
    </Panel>
  );
}
