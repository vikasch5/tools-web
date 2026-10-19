import { useEffect, useRef } from "react";
import { Form, Link } from "react-router";
import { ArrowRight, Search } from "lucide-react";
import { tools, toolPath } from "~/data/tools";

const suggestions = ["merge-pdf", "compress-image", "json-formatter", "word-counter"]
  .map((slug) => tools.find((t) => t.slug === slug))
  .filter((t) => t !== undefined);

/**
 * Prominent search field. A plain GET form to /tools, so it works before
 * hydration and without JavaScript. Press "/" anywhere to focus it.
 */
export function HeroSearch() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing =
        target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div>
      <Form method="get" action="/tools" role="search">
        <label htmlFor="hero-search" className="sr-only">
          Search tools
        </label>
        <div className="group flex h-14 items-center rounded-xl border border-border bg-surface p-1.5 pl-4 shadow-md transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15 sm:h-16">
          <Search aria-hidden size={20} strokeWidth={1.75} className="shrink-0 text-fg-subtle" />
          <input
            ref={inputRef}
            id="hero-search"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Try “merge pdf”"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-fg outline-none placeholder:text-fg-subtle sm:text-lg [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="submit"
            aria-label="Search"
            className="inline-flex h-full shrink-0 items-center gap-2 rounded-lg bg-fg px-3.5 text-sm font-medium text-bg transition-colors hover:bg-fg/85 sm:px-5"
          >
            <span className="hidden sm:inline">Search</span>
            <ArrowRight aria-hidden size={17} strokeWidth={1.75} />
          </button>
        </div>
      </Form>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2">
        <span className="mr-1 text-sm text-fg-subtle">Popular:</span>
        {suggestions.map((tool) => (
          <Link
            key={tool.slug}
            to={toolPath(tool)}
            className="inline-flex h-8 items-center rounded-full border border-border bg-surface px-3 text-[0.8125rem] text-fg-muted shadow-sm transition-colors hover:border-accent/50 hover:text-fg pointer-coarse:h-10"
          >
            {tool.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
