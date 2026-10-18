import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "~/lib/cn";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium " +
  "transition-colors duration-150 ease-out select-none " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-fg text-bg hover:bg-fg/85",
  accent: "bg-accent text-on-accent hover:brightness-95",
  secondary:
    "border border-border bg-surface text-fg shadow-sm hover:border-border-strong",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger:
    "border border-border bg-surface text-danger hover:border-danger hover:bg-danger-soft",
};

// Coarse pointers always get at least a 44px target.
const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm pointer-coarse:h-11",
  md: "h-10 px-4 text-sm pointer-coarse:h-11",
  lg: "h-12 px-5 text-base",
};

const iconSizes: Record<ButtonSize, number> = { sm: 16, md: 16, lg: 18 };

export function buttonClasses({
  variant = "secondary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Decorative leading icon; the visible label names the action. */
  icon?: LucideIcon;
  children: ReactNode;
};

function Content({ icon: Icon, size = "md", children }: CommonProps) {
  return (
    <>
      {Icon && <Icon aria-hidden size={iconSizes[size]} strokeWidth={1.75} />}
      {children}
    </>
  );
}

export function Button({
  variant,
  size,
  icon,
  className,
  type = "button",
  children,
  ...rest
}: CommonProps & ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...rest}
    >
      <Content icon={icon} size={size}>
        {children}
      </Content>
    </button>
  );
}

/** A navigation link styled as a button. Renders a crawlable <a>. */
export function ButtonLink({
  variant,
  size,
  icon,
  className,
  children,
  ...rest
}: CommonProps & LinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...rest}>
      <Content icon={icon} size={size}>
        {children}
      </Content>
    </Link>
  );
}
