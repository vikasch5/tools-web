import { useEffect, useMemo, useRef, useState } from "react";
import { Form, Link, useSearchParams } from "react-router";
import { Search, SearchX, X } from "lucide-react";
import type { Route } from "./+types/tools";
import { Container } from "~/components/layout/Container";
import { Breadcrumbs } from "~/components/layout/Breadcrumbs";
import { ToolCard } from "~/components/tool/ToolCard";
import { CategoryIcon } from "~/components/ui/CategoryIcon";
import { categories, categoryPath } from "~/data/categories";
import { tools } from "~/data/tools";
import { searchTools } from "~/lib/search";
import { breadcrumbJsonLd, buildMeta } from "~/lib/seo";
import { site } from "~/config/site";
import { cn } from "~/lib/cn";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: `All Tools – ${tools.filter((t) => t.status === "live").length} Free Online Tools | ${site.name}`,
    description:
      "Browse every tool: developer formatters, PDF, image, text, converters, design, generators and calculators. Search by name or task. All run in your browser.",
    path: "/tools",
    jsonLd: [breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "All tools", path: "/tools" }])],
  });
}

const live = tools.filter((t) => t.status === "live");
const suggestions = ["merge pdf", "compress image", "json", "word count", "uuid"];

/**
 * Directory with instant search. The search box is a GET form, so it works
 * before hydration; once hydrated, results filter as you type and the URL
 * keeps ?q= and ?category= in sync (shareable, back button friendly).
 */
export default function ToolsPage() {
  const [params, setParams] = useSearchParams();
  // /tools is prerendered without a query string, so the first render must
  // match that HTML; ?q= and ?category= apply once hydrated.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const [query, setQuery] = useState("");
  const category = hydrated ? (params.get("category") ?? "") : "";
  const inputRef = useRef<HTMLInputElement>(null);

  // Follow back/forward navigation.
  useEffect(() => {
    if (!hydrated) return;
    const q = params.get("q") ?? "";
    setQuery((current) => (current.trim() === q ? current : q));
  }, [params, hydrated]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) && !target.isContentEditable) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const update = (next: { q?: string; category?: string }) => {
    const q = next.q ?? query;
    const c = next.category ?? category;
    setParams(
      () => {
        const p = new URLSearchParams();
        if (q.trim()) p.set("q", q.trim());
        if (c) p.set("category", c);
        return p;
      },
      { replace: next.q !== undefined, preventScrollReset: true },
    );
  };

  const inCategory = category ? live.filter((t) => t.category === category) : live;
  const results = useMemo(() => searchTools(query, inCategory), [query, inCategory]);
  const searching = query.trim() !== "";
  const counts = new Map(categories.map((c) => [c.slug, live.filter((t) => t.category === c.slug).length]));

  return (
    <>
      <header className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_70%)]" />
        <Container className="relative pt-6 pb-10 sm:pt-8 sm:pb-12">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "All tools", path: "/tools" }]} />
          <h1 className="mt-6 text-h1 font-bold text-fg">All tools</h1>
          <p className="mt-3 max-w-2xl text-lg text-fg-muted">
            {live.length} free tools that run in your browser. Search by name or by what you want to do.
          </p>

          <Form
            method="get"
            role="search"
            className="mt-8 max-w-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              update({ q: query });
            }}
          >
            <label htmlFor="tools-search" className="sr-only">
              Search tools
            </label>
            <div className="flex h-14 items-center gap-2 rounded-xl border border-border bg-surface pr-2 pl-4 shadow-md transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
              <Search aria-hidden size={20} strokeWidth={1.75} className="shrink-0 text-fg-subtle" />
              <input
                ref={inputRef}
                id="tools-search"
                name="q"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  update({ q: event.target.value });
                }}
                autoComplete="off"
                placeholder="Search, e.g. “compress image”"
                aria-controls="tools-results"
                className="h-full min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    update({ q: "" });
                    inputRef.current?.focus();
                  }}
                  className="inline-flex size-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
                >
                  <X aria-hidden size={17} />
                </button>
              )}
            </div>
            {category && <input type="hidden" name="category" value={category} />}
          </Form>

          <nav aria-label="Filter by category" className="mt-5">
            <ul className="flex flex-wrap gap-2">
              {[{ slug: "", name: "All", count: live.length }, ...categories.map((c) => ({ slug: c.slug, name: c.shortName, count: counts.get(c.slug) ?? 0 }))].map(
                (c) => (
                  <li key={c.slug || "all"}>
                    <Link
                      to={{ search: new URLSearchParams({ ...(query.trim() ? { q: query.trim() } : {}), ...(c.slug ? { category: c.slug } : {}) }).toString() }}
                      preventScrollReset
                      aria-current={category === c.slug ? "true" : undefined}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors pointer-coarse:h-11",
                        category === c.slug
                          ? "border-accent bg-accent text-on-accent"
                          : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
                      )}
                    >
                      {c.name}
                      <span className={cn("font-mono text-xs", category === c.slug ? "text-on-accent/70" : "text-fg-subtle")}>{c.count}</span>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>
        </Container>
      </header>

      <Container className="py-10 sm:py-14">
        <p role="status" className="label-mono text-fg-subtle">
          {searching
            ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${query.trim()}”${category ? ` in ${categories.find((c) => c.slug === category)?.name}` : ""}`
            : category
              ? `${results.length} tools in ${categories.find((c) => c.slug === category)?.name}`
              : `${results.length} tools`}
        </p>

        <div id="tools-results" className="mt-5">
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-14 text-center">
              <SearchX aria-hidden size={28} strokeWidth={1.5} className="mx-auto text-fg-subtle" />
              <h2 className="mt-4 text-xl font-semibold text-fg">No tools match “{query.trim()}”</h2>
              <p className="mx-auto mt-2 max-w-md text-fg-muted">
                Try a shorter word, or one of these searches:
              </p>
              <ul className="mt-5 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(s);
                        update({ q: s, category: "" });
                      }}
                      className="inline-flex h-9 items-center rounded-full border border-border bg-bg px-3.5 text-sm text-fg-muted hover:border-border-strong hover:text-fg pointer-coarse:h-11"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : searching || category ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((tool) => (
                <li key={tool.slug}>
                  <ToolCard tool={tool} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-14">
              {categories.map((c) => {
                const list = live.filter((t) => t.category === c.slug);
                if (list.length === 0) return null;
                return (
                  <section key={c.slug} aria-labelledby={`cat-${c.slug}`}>
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={c} size="sm" />
                      <h2 id={`cat-${c.slug}`} className="text-xl font-semibold tracking-tight text-fg">
                        <Link to={categoryPath(c.slug)} className="hover:underline">
                          {c.name}
                        </Link>
                      </h2>
                      <span className="font-mono text-xs text-fg-subtle">{list.length}</span>
                    </div>
                    <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((tool) => (
                        <li key={tool.slug}>
                          <ToolCard tool={tool} />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
