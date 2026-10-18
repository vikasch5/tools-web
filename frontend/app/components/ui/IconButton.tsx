import type { ComponentPropsWithoutRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "~/lib/cn";

type IconButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  icon: LucideIcon;
  /** Required accessible name, since there is no visible text. */
  label: string;
  size?: "sm" | "md";
  variant?: "ghost" | "secondary";
};

const sizes = {
  sm: "size-8 pointer-coarse:size-11",
  md: "size-10 pointer-coarse:size-11",
};

export function IconButton({
  icon: Icon,
  label,
  size = "md",
  variant = "ghost",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-150",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "ghost"
          ? "text-fg-muted hover:bg-surface-2 hover:text-fg"
          : "border border-border bg-surface text-fg-muted shadow-sm hover:border-border-strong hover:text-fg",
        sizes[size],
        className,
      )}
      {...rest}
    >
      <Icon aria-hidden size={size === "sm" ? 16 : 18} strokeWidth={1.75} />
    </button>
  );
}
