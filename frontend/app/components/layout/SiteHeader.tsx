import { Link, NavLink } from "react-router";
import { Search } from "lucide-react";
import { primaryNav } from "~/config/site";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { CategoriesMenu } from "./CategoriesMenu";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";

const navLinkClass =
  "relative inline-flex h-16 items-center px-3 text-sm font-medium text-fg-muted transition-colors hover:text-fg " +
  "aria-[current=page]:text-fg aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-3 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-accent";

/**
 * Global header. The search control links to the directory for now; the
 * command palette (Phase 3) will enhance it without changing the markup.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-header border-b border-border bg-bg/90 backdrop-blur-lg">
      <Container className="flex h-16 items-center gap-2">
        <Logo className="mr-4" />

        <nav aria-label="Main" className="hidden items-center lg:flex">
          <CategoriesMenu />
          {primaryNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/tools"
            className="mr-2 hidden h-9 w-60 items-center gap-2 rounded-md border border-border bg-surface pr-1.5 pl-3 text-sm text-fg-subtle transition-colors hover:border-border-strong md:flex xl:w-72"
          >
            <Search aria-hidden size={15} strokeWidth={1.75} />
            <span className="flex-1">Search tools</span>
          </Link>
          <Link
            to="/tools"
            aria-label="Search tools"
            title="Search tools"
            className="inline-flex size-10 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg pointer-coarse:size-11 md:hidden"
          >
            <Search aria-hidden size={18} strokeWidth={1.75} />
          </Link>
          <ThemeToggle />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
