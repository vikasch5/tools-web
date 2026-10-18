import { Link } from "react-router";
import { categories, categoryPath } from "~/data/categories";
import { ads, companyNav, legalNav, site, type NavLink } from "~/config/site";
import { Container } from "./Container";
import { LogoMark } from "./Logo";
import { ThemeSelect } from "./ThemeToggle";

declare global {
  interface Window {
    googlefc?: { callbackQueue?: unknown[]; showRevocationMessage?: () => void };
  }
}

/** Reopens Google's consent message so visitors can change or withdraw consent. */
function openConsentSettings() {
  const fc = (window.googlefc = window.googlefc ?? {});
  fc.callbackQueue = fc.callbackQueue ?? [];
  fc.callbackQueue.push(() => window.googlefc?.showRevocationMessage?.());
}

const footerLinkClass =
  "inline-flex min-h-8 items-center text-sm text-fg-muted transition-colors hover:text-fg pointer-coarse:min-h-11";

function FooterColumn({ title, links, extra }: { title: string; links: NavLink[]; extra?: React.ReactNode }) {
  return (
    <div>
      <h2 className="label-mono font-sans text-fg-subtle">{title}</h2>
      <ul className="mt-4 space-y-1">
        {links.map((link) => (
          <li key={link.to + link.label}>
            <Link to={link.to} className={footerLinkClass}>
              {link.label}
            </Link>
          </li>
        ))}
        {extra && <li>{extra}</li>}
      </ul>
    </div>
  );
}

const categoryLinks = categories.map((c) => ({
  label: c.name,
  to: categoryPath(c.slug),
}));
const half = Math.ceil(categoryLinks.length / 2);

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <Container className="pt-14 pb-8 lg:pt-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-[1.6fr_repeat(4,1fr)] lg:gap-10">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <LogoMark />
            <p className="mt-5 max-w-xs font-display text-xl leading-snug font-semibold tracking-tight text-fg">
              {site.tagline}
            </p>
          </div>
          <nav aria-label="Tool categories" className="contents">
            <FooterColumn title="Tools" links={categoryLinks.slice(0, half)} />
            <FooterColumn title="More tools" links={categoryLinks.slice(half)} />
          </nav>
          <nav aria-label="Company" className="contents">
            <FooterColumn title="Company" links={companyNav} />
          </nav>
          <nav aria-label="Legal" className="contents">
            <FooterColumn
              title="Legal"
              links={legalNav}
              extra={
                ads.enabled && (
                  <button type="button" onClick={openConsentSettings} className={`${footerLinkClass} cursor-pointer`}>
                    Privacy and cookie settings
                  </button>
                )
              }
            />
          </nav>
        </div>

        <p
          aria-hidden
          className="mt-16 overflow-hidden font-display text-[clamp(3.5rem,16vw,13rem)] leading-[0.8] font-extrabold tracking-[-0.05em] whitespace-nowrap text-surface-2 select-none"
        >
          {site.name.toLowerCase()}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label-mono text-fg-subtle">
            © {new Date().getFullYear()} {site.name} · Design prototype
          </p>
          <ThemeSelect />
        </div>
      </Container>
    </footer>
  );
}
