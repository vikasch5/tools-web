import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { ArrowRight, ChevronDown } from "lucide-react";
import { categories, categoryPath } from "~/data/categories";
import { cn } from "~/lib/cn";
import { CategoryIcon } from "~/components/ui/CategoryIcon";

/**
 * Desktop "Categories" disclosure (ARIA disclosure pattern, not a menu):
 * a button toggling a panel of ordinary links. Closes on Escape, outside
 * click and navigation.
 */
export function CategoriesMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-16 items-center gap-1 px-3 text-sm font-medium transition-colors",
          open ? "text-fg" : "text-fg-muted hover:text-fg",
        )}
      >
        Categories
        <ChevronDown
          aria-hidden
          size={15}
          strokeWidth={1.75}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-popover border-b border-border bg-surface shadow-lg"
      >
        <div className="mx-auto grid max-w-site grid-cols-[1fr_16rem] gap-10 px-8 py-8">
          <ul className="grid grid-cols-2 gap-1 xl:grid-cols-4">
            {categories.map((category) => {
              return (
                <li key={category.slug}>
                  <Link
                    to={categoryPath(category.slug)}
                    className="group flex h-full gap-3 rounded-lg p-3 transition-colors hover:bg-surface-2"
                  >
                    <CategoryIcon category={category} />
                    <span>
                      <span className="block text-sm font-semibold text-fg">
                        {category.name}
                      </span>
                      <span className="mt-1 block text-[0.8125rem] leading-snug text-fg-muted">
                        {category.description}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col justify-between border-l border-border pl-8">
            <div>
              <p className="text-sm font-semibold text-accent-fg">Directory</p>
              <p className="mt-3 font-display text-xl leading-tight font-semibold tracking-tight text-fg">
                Every tool, searchable in one place.
              </p>
            </div>
            <Link
              to="/tools"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-fg"
            >
              <span className="underline decoration-border-strong underline-offset-4 group-hover:decoration-accent">
                Browse all tools
              </span>
              <ArrowRight
                aria-hidden
                size={15}
                strokeWidth={1.75}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
