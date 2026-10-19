import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowRight, CornerDownLeft, Search, X } from "lucide-react";
import { CategoryIcon } from "~/components/ui/CategoryIcon";
import { categories } from "~/data/categories";
import { tools, toolPath } from "~/data/tools";
import { searchTools } from "~/lib/search";
import { cn } from "~/lib/cn";

const live = tools.filter((t) => t.status === "live");
const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
const popular = live.filter((t) => t.popular).slice(0, 8);

/**
 * Ctrl/⌘K quick search over all tools, in a native modal <dialog> (focus
 * trap, Escape and focus return come from the browser). Implements the
 * ARIA combobox pattern: arrows move the active option, Enter opens it.
 * The trigger is a real link to /tools, so it still works without JS.
 */
export function CommandPalette({ triggers }: { triggers: { className: string; compact?: boolean }[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const listId = useId();

  const results = useMemo(
    () => (query.trim() ? searchTools(query, live).slice(0, 8) : popular),
    [query],
  );

  const open = () => {
    setQuery("");
    setActive(0);
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  };
  const close = () => dialogRef.current?.close();

  useEffect(() => close(), [location.pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (dialogRef.current?.open) close();
        else open();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (index: number) => {
    const tool = results[index];
    if (tool) navigate(toolPath(tool));
    else if (query.trim()) navigate(`/tools?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      {triggers.map(({ className, compact }) => (
        <Link
          key={className}
          to="/tools"
          onClick={(event) => {
            event.preventDefault();
            open();
          }}
          aria-label={compact ? "Search tools" : undefined}
          aria-keyshortcuts="Control+K Meta+K"
          className={className}
        >
          <Search aria-hidden size={compact ? 18 : 15} strokeWidth={1.75} />
          {!compact && <span className="flex-1">Search tools</span>}
        </Link>
      ))}

      <dialog
        ref={dialogRef}
        aria-label="Search tools"
        onClick={(event) => event.target === event.currentTarget && close()}
        className="mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-xl border border-border bg-surface p-0 text-fg shadow-lg backdrop:bg-overlay backdrop:backdrop-blur-sm"
      >
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
          <Search aria-hidden size={18} strokeWidth={1.75} className="shrink-0 text-fg-subtle" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            aria-label="Search tools"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                go(active);
              }
            }}
            placeholder="Search tools…"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={close}
            className="-mr-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg pointer-coarse:size-11"
          >
            <X aria-hidden size={17} strokeWidth={1.75} />
          </button>
        </div>

        <p className="label-mono px-4 pt-3 pb-1 text-fg-subtle">{query.trim() ? "Results" : "Popular"}</p>
        <ul id={listId} role="listbox" aria-label="Tools" className="max-h-[50vh] overflow-y-auto px-2 pb-2">
          {results.map((tool, i) => {
            const category = categoryBySlug.get(tool.category);
            return (
              <li
                key={tool.slug}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseMove={() => setActive(i)}
                onClick={() => go(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2",
                  i === active && "bg-surface-2",
                )}
              >
                {category && <CategoryIcon category={category} size="sm" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{tool.name}</span>
                  <span className="block truncate text-xs text-fg-muted">{tool.description}</span>
                </span>
                {i === active && <CornerDownLeft aria-hidden size={15} className="shrink-0 text-fg-subtle" />}
              </li>
            );
          })}
        </ul>
        {results.length === 0 && (
          <p className="px-4 pb-4 text-sm text-fg-muted">No tools match “{query.trim()}”.</p>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-2/50 px-4 py-2.5 text-xs text-fg-subtle">
          <span>
            {live.length} free tools
          </span>
          <Link
            to={query.trim() ? `/tools?q=${encodeURIComponent(query.trim())}` : "/tools"}
            className="ml-auto inline-flex items-center gap-1 font-medium text-fg-muted hover:text-fg"
          >
            See all tools <ArrowRight aria-hidden size={13} />
          </Link>
        </div>
      </dialog>
    </>
  );
}
