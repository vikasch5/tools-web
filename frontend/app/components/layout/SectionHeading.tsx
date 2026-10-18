import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "~/lib/cn";

/**
 * Section header: small eyebrow, display title, optional description and
 * a trailing "see all" link.
 */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  /** Used for aria-labelledby on the parent section. */
  id: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { label: string; to: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-accent-fg">{eyebrow}</p>
        <h2 id={id} className="mt-2 text-h2 font-bold text-fg">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-lg leading-relaxed text-fg-muted">{description}</p>
        )}
      </div>
      {action && (
        <Link
          to={action.to}
          className="group inline-flex h-10 shrink-0 items-center gap-1.5 self-start rounded-full border border-border bg-surface px-4 text-sm font-medium text-fg shadow-sm transition-colors hover:border-border-strong sm:self-auto"
        >
          {action.label}
          <ArrowRight
            aria-hidden
            size={15}
            strokeWidth={2}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
