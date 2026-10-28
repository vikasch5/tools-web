import type { ReactNode } from "react";
import { FileText, X } from "lucide-react";
import { IconButton } from "~/components/ui/IconButton";
import { FileDrop } from "../FileDrop";
import { Panel, PanelSection, StatusMessage, type StatusTone } from "../Panel";
import { formatBytes } from "../format";
import { MAX_PDF_BYTES, PDF_ACCEPT } from "./pdf-shared";

export type Status = { tone: StatusTone; text: string };

/** The empty state shared by single-PDF tools: a drop zone and a status line. */
export function PdfDropPanel({
  status,
  opening = false,
  onFile,
  onReject,
  accept = PDF_ACCEPT,
  title = "Drop a PDF here",
  hint = "Up to 100 MB.",
}: {
  status: Status;
  opening?: boolean;
  onFile: (file: File) => void;
  onReject: (message: string) => void;
  accept?: string[];
  title?: string;
  hint?: string;
}) {
  return (
    <Panel
      status={
        opening ? (
          <StatusMessage tone="working">Opening…</StatusMessage>
        ) : (
          <StatusMessage tone={status.tone}>{status.text}</StatusMessage>
        )
      }
    >
      <div className="p-4 sm:p-6">
        <FileDrop
          accept={accept}
          maxBytes={MAX_PDF_BYTES}
          title={title}
          hint={hint}
          onFiles={([file]) => onFile(file)}
          onReject={onReject}
        />
      </div>
    </Panel>
  );
}

/** "Document" section: file name, size and an optional detail, with a remove button. */
export function FileSummary({
  file,
  detail,
  onRemove,
  title = "Document",
  children,
}: {
  file: File;
  detail?: ReactNode;
  onRemove: () => void;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <PanelSection title={title} actions={<IconButton icon={X} label="Remove file" size="sm" onClick={onRemove} />}>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-cat-pdf-soft text-cat-pdf">
          <FileText aria-hidden size={18} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{file.name}</p>
          <p className="text-xs text-fg-muted">
            {detail ? <>{detail} · </> : null}
            {formatBytes(file.size)}
          </p>
        </div>
      </div>
      {children}
    </PanelSection>
  );
}

export const pageWord = (n: number) => `${n} ${n === 1 ? "page" : "pages"}`;
