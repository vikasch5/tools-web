import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, TriangleAlert, type LucideIcon } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/cn";

/** The framed workspace every non-text tool sits in (matches ToolWorkspace). */
export function Panel({
  label = "Tool workspace",
  toolbar,
  action,
  status,
  children,
  className,
}: {
  label?: string;
  /** Options and secondary buttons, above the content. */
  toolbar?: ReactNode;
  /**
   * The one thing to press to get the result (a PrimaryAction). It sits in
   * a bar under the content that stays at the bottom of the screen while
   * the panel is in view, so it is never scrolled out of reach.
   */
  action?: ReactNode;
  status?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={label}
      // overflow-clip (not hidden) keeps the rounded corners without
      // breaking the sticky action bar.
      className="flex flex-col overflow-clip rounded-xl border border-border bg-surface shadow-md"
    >
      {toolbar && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface-2/50 px-2.5 py-2 sm:px-3">
          {toolbar}
        </div>
      )}
      <div className={cn("min-w-0", className)}>{children}</div>
      {action && (
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t border-border bg-surface-2/95 px-3 py-3 backdrop-blur-sm sm:px-4">
          {action}
        </div>
      )}
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

/**
 * The main button of a tool: large, full width on phones, with a spinner
 * while it works. One per panel, passed as Panel's `action`.
 */
export function PrimaryAction({
  icon,
  busy = false,
  disabled = false,
  hint,
  children,
  ...rest
}: {
  icon?: LucideIcon;
  busy?: boolean;
  disabled?: boolean;
  /** Short note next to the button, e.g. what will be saved. */
  hint?: ReactNode;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "children" | "disabled">) {
  return (
    <>
      <Button
        variant="primary"
        size="lg"
        icon={busy ? undefined : icon}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        className="w-full sm:w-auto"
        {...rest}
      >
        {busy && <LoaderCircle aria-hidden size={18} className="animate-spin" />}
        {children}
      </Button>
      {hint && <span className="text-sm text-fg-muted">{hint}</span>}
    </>
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
