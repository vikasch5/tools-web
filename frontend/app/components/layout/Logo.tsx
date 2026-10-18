import { Link } from "react-router";
import { site } from "~/config/site";
import { cn } from "~/lib/cn";

/** Brand mark: an ink tile with a bench-top bar and a signal-orange block. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="30"
      height="30"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="6" className="fill-fg" />
      <rect x="7" y="9" width="18" height="3.5" rx="1" className="fill-bg" />
      <rect x="9" y="12.5" width="3.5" height="10.5" rx="1" className="fill-bg" />
      <rect x="17" y="16" width="7" height="7" rx="1.25" className="fill-accent" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label={`${site.name} home`}
      className={cn("inline-flex items-center gap-2.5 rounded-md text-fg", className)}
    >
      <LogoMark />
      <span className="font-display text-[1.1875rem] font-bold tracking-[-0.03em]">
        {site.name}
      </span>
    </Link>
  );
}
