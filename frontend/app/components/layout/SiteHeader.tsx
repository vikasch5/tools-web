import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router";
import { ArrowRight } from "lucide-react";
import { primaryNav } from "~/config/site";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { CategoriesMenu } from "./CategoriesMenu";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "./CommandPalette";

const navLinkClass =
  "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-fg-muted transition-colors duration-150 " +
  "hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:text-fg";

/** True once the page has scrolled away from the top. */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 4);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return scrolled;
}

/**
 * Global header. Sits flush with the page at the top and gains a hairline
 * and soft shadow once content scrolls under it. The search control opens
 * the quick-search dialog (and falls back to the /tools directory without
 * JavaScript).
 */
export function SiteHeader() {
  const scrolled = useScrolled();
  return (
    <header
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-header border-b border-transparent bg-bg/80 backdrop-blur-xl backdrop-saturate-150 transition-[border-color,box-shadow] duration-200 data-scrolled:border-border data-scrolled:shadow-sm"
    >
      <Container className="flex h-16 items-center gap-3">
        <Logo />

        <span aria-hidden className="mx-2 hidden h-5 w-px bg-border lg:block" />

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          <CategoriesMenu />
          {primaryNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <CommandPalette
            triggers={[
              {
                className:
                  "hidden h-9 w-52 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-fg-subtle shadow-sm transition-colors hover:border-border-strong hover:text-fg-muted md:flex xl:w-64",
              },
              {
                compact: true,
                className:
                  "inline-flex size-10 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg pointer-coarse:size-11 md:hidden",
              },
            ]}
          />
          <Link
            to="/tools"
            className="group hidden h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent pr-3 pl-4 text-sm font-medium whitespace-nowrap text-on-accent transition-colors duration-150 hover:bg-accent-fg sm:inline-flex"
          >
            All tools
            <ArrowRight
              aria-hidden
              size={15}
              strokeWidth={2}
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </Link>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
