import { useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { ArrowRight, ArrowUpRight, Menu, Search, X } from "lucide-react";
import { categories, categoryPath } from "~/data/categories";
import { companyNav, legalNav } from "~/config/site";
import { IconButton } from "~/components/ui/IconButton";
import { CategoryIcon } from "~/components/ui/CategoryIcon";
import { Logo } from "./Logo";
import { ButtonLink } from "~/components/ui/Button";

const moreLinks = [...companyNav, ...legalNav];

/**
 * Mobile navigation sheet built on a native modal <dialog>: the browser
 * provides the focus trap, inert background, Escape-to-close and focus
 * return. We add backdrop-click and close-on-navigation. Full screen on
 * phones, a side sheet from `sm` up.
 */
export function MobileNav() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const location = useLocation();

  useEffect(() => {
    dialogRef.current?.close();
  }, [location.pathname]);

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <IconButton icon={Menu} label="Open menu" onClick={open} className="lg:hidden" />

      <dialog
        ref={dialogRef}
        aria-label="Site menu"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="m-0 ml-auto h-full max-h-full w-full max-w-none bg-bg p-0 text-fg backdrop:bg-overlay sm:max-w-md sm:border-l sm:border-border sm:shadow-lg"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
            <Logo />
            <IconButton icon={X} label="Close menu" onClick={close} autoFocus />
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-5 pb-8 sm:px-6">
            <Link
              to="/tools"
              className="flex h-12 items-center gap-2.5 rounded-md border border-border bg-surface px-3.5 text-[0.9375rem] text-fg-subtle"
            >
              <Search aria-hidden size={17} strokeWidth={1.75} />
              Search tools
            </Link>

            <nav aria-label="Categories" className="mt-8">
              <h2 className="label-mono text-fg-subtle">Categories</h2>
              <ul className="mt-2 border-t border-border">
                {categories.map((category) => {
                  return (
                    <li key={category.slug} className="border-b border-border">
                      <NavLink
                        to={categoryPath(category.slug)}
                        className="group flex min-h-14 items-center gap-3.5 py-2 text-fg aria-[current=page]:text-accent-fg"
                      >
                        <CategoryIcon category={category} size="sm" />
                        <span className="flex-1 font-display text-lg font-semibold tracking-tight">
                          {category.name}
                        </span>
                        <span className="label-mono text-fg-subtle">{category.code}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <nav aria-label="More" className="mt-8">
              <h2 className="label-mono text-fg-subtle">More</h2>
              <ul className="mt-2 grid grid-cols-2 gap-x-4">
                {moreLinks.map((item) => (
                  <li key={item.to + item.label}>
                    <NavLink
                      to={item.to}
                      className="flex min-h-11 items-center gap-1 text-[0.9375rem] text-fg-muted hover:text-fg aria-[current=page]:text-fg"
                    >
                      {item.label}
                      <ArrowUpRight aria-hidden size={14} strokeWidth={1.5} className="opacity-50" />
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="shrink-0 border-t border-border px-4 py-3 sm:px-6">
            <ButtonLink to="/tools" variant="primary" size="lg" icon={ArrowRight} className="w-full">
              Browse all tools
            </ButtonLink>
          </div>
        </div>
      </dialog>
    </>
  );
}
