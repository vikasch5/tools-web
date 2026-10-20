import { Link } from "react-router";
import { site } from "~/config/site";
import { cn } from "~/lib/cn";

/**
 * Inline SVG mark — kept for places that only need the square icon
 * (e.g. og-image generation). Not rendered in the main header/footer.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/images/logo-mark.svg"
      alt=""
      aria-hidden
      width={32}
      height={32}
      className={cn("shrink-0", className)}
    />
  );
}

/**
 * Full horizontal logo — SVG on light backgrounds.
 * Pass variant="dark" on dark/coloured backgrounds (footer, mobile nav overlay).
 */
export function Logo({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const src = variant === "dark" ? "/images/logo-dark.svg" : "/images/logo.svg";
  return (
    <Link
      to="/"
      aria-label={`${site.name} home`}
      className={cn("inline-flex items-center rounded-md", className)}
    >
      <img
        src={src}
        alt={site.name}
        height={36}
        style={{ height: "36px", width: "auto", display: "block" }}
      />
    </Link>
  );
}
