import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "~/lib/cn";

/** The framed workspace every non-text tool sits in (matches ToolWorkspace). */
export function Panel({
  label = "Tool workspace",
  toolbar,
  status,
  children,
  className,
}: {
  label?: string;
  toolbar?: ReactNode;
  status?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={label}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-md"
    >
      {toolbar && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface-2/50 px-2.5 py-2 sm:px-3">
          {toolbar}
        </div>
      )}
      <div className={cn("min-w-0", className)}>{children}</div>
      {status !== undefined && (
        <div
          role="status"
          className="flex min-h-10 shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-3 py-1.5 text-sm sm:px-4"
        >
          {status}
        </div>
      )}
    </section>
  );
}

/** A labelled column or region inside a Panel. */
export function PanelSection({
  title,
  actions,
  children,
  className,
  id,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col bg-surface", className)}>
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border pr-1.5 pl-3 pointer-coarse:h-12 sm:pl-4">
        <h2 id={id} className="label-mono font-sans text-fg">
          {title}
        </h2>
        {actions && <div className="ml-auto flex items-center gap-0.5">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export type StatusTone = "idle" | "working" | "success" | "warning" | "error";

const toneStyles: Record<StatusTone, { icon?: LucideIcon; className: string }> = {
  idle: { className: "text-fg-subtle" },
  working: { icon: LoaderCircle, className: "text-fg-muted" },
  success: { icon: CircleCheck, className: "text-success" },
  warning: { icon: TriangleAlert, className: "text-warning" },
  error: { icon: CircleAlert, className: "text-danger" },
};

/** Status text with an icon, so state is never shown by colour alone. */
export function StatusMessage({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  const { icon: Icon, className } = toneStyles[tone];
  return (
    <span className={cn("inline-flex min-w-0 items-start gap-1.5", className)}>
      {Icon && (
        <Icon
          aria-hidden
          size={15}
          strokeWidth={2}
          className={cn("mt-0.5 shrink-0", tone === "working" && "animate-spin")}
        />
      )}
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}

/** Copies text and reports success for two seconds. */
export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = useCallback(async (text: string, key = "default") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 2000);
      return true;
    } catch {
      return false;
    }
  }, []);
  return { copied, copy };
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
