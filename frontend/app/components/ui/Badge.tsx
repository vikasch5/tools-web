import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "~/lib/cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface text-fg-muted",
  accent: "border-transparent bg-accent-soft text-accent-fg",
  success: "border-transparent bg-success-soft text-success",
  warning: "border-transparent bg-warning-soft text-warning",
  danger: "border-transparent bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  icon: Icon,
  className,
  children,
}: {
  tone?: BadgeTone;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[0.6875rem] font-medium uppercase leading-4 tracking-wider",
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon aria-hidden size={12} strokeWidth={2} />}
      {children}
    </span>
  );
}
