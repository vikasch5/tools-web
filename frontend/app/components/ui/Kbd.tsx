import type { ReactNode } from "react";
import { cn } from "~/lib/cn";

export function Kbd({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-border bg-surface px-1 font-mono text-[0.6875rem] font-medium text-fg-subtle",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
