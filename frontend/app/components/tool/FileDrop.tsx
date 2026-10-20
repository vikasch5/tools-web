import { useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/cn";
import { formatBytes } from "./format";

/**
 * Drop zone with a real button, so files can be chosen by keyboard or
 * touch as well as dragged in. Files over the limit are rejected here.
 */
export function FileDrop({
  accept,
  multiple = false,
  maxBytes,
  title,
  hint,
  onFiles,
  onReject,
  compact = false,
}: {
  accept: string[];
  multiple?: boolean;
  maxBytes: number;
  title: string;
  hint: string;
  onFiles: (files: File[]) => void;
  onReject: (message: string) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const take = (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list].slice(0, multiple ? undefined : 1);
    const tooBig = files.find((f) => f.size > maxBytes);
    if (tooBig) {
      onReject(`“${tooBig.name}” is ${formatBytes(tooBig.size)}. The limit is ${formatBytes(maxBytes)}.`);
      return;
    }
    // An empty accept list takes any file.
    const wrong = accept.length
      ? files.find((f) => !accept.some((a) => (a.startsWith(".") ? f.name.toLowerCase().endsWith(a) : f.type === a)))
      : undefined;
    if (wrong) {
      onReject(`“${wrong.name}” is not a supported file. Use ${accept.filter((a) => a.startsWith(".")).join(", ")}.`);
      return;
    }
    onFiles(files);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        take(event.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed text-center transition-colors",
        compact ? "px-4 py-5 sm:flex-row sm:text-left" : "px-6 py-12",
        dragging ? "border-accent bg-accent-soft" : "border-border bg-bg",
      )}
    >
      {!compact && (
        <span className="inline-flex size-12 items-center justify-center rounded-lg bg-surface text-fg-muted shadow-sm ring-1 ring-border">
          <FileUp aria-hidden size={22} strokeWidth={1.75} />
        </span>
      )}
      <div className={cn("min-w-0", compact && "sm:flex-1")}>
        <p className="font-medium text-fg">{title}</p>
        <p className="mt-1 text-sm text-fg-muted">{hint}</p>
      </div>
      <Button variant={compact ? "secondary" : "primary"} icon={FileUp} onClick={() => inputRef.current?.click()}>
        {multiple ? "Choose files" : "Choose file"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        multiple={multiple}
        className="hidden"
        tabIndex={-1}
        onChange={(event) => {
          take(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
