import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { formatGuideDate, guidePath, type Guide } from "~/data/guides";

/** Grid of guide cards, used on /guides, the home page and tool pages. */
export function GuideCards({ guides, headingLevel = "h3" }: { guides: Guide[]; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {guides.map((guide) => (
        <li key={guide.slug}>
          <Link
            to={guidePath(guide)}
            className="group flex h-full flex-col rounded-xl border border-border bg-bg p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong/60 hover:bg-surface hover:shadow-md"
          >
            <span className="text-xs font-medium tracking-wide text-fg-subtle uppercase">{guide.topic}</span>
            <Heading className="mt-2 flex items-start justify-between gap-3 font-sans text-base font-semibold text-fg">
              {guide.title}
              <ArrowUpRight
                aria-hidden
                size={18}
                strokeWidth={1.75}
                className="mt-0.5 shrink-0 text-fg-subtle transition-colors group-hover:text-accent-fg"
              />
            </Heading>
            <span className="mt-2 block text-sm leading-relaxed text-fg-muted">{guide.description}</span>
            <span className="mt-auto pt-4 text-xs text-fg-subtle">Updated {formatGuideDate(guide.updated)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
