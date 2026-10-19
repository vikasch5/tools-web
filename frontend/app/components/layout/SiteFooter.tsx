import { Link } from "react-router";
import { Check, ShieldCheck } from "lucide-react";
import { categories, categoryPath } from "~/data/categories";
import { ads, companyNav, legalNav, site, type NavLink } from "~/config/site";
import { Container } from "./Container";
import { Logo } from "./Logo";

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

const highlights = ["No sign-up or account", "Files stay on your device", "Free for personal and commercial use"];

function FooterColumn({ title, links, extra }: { title: string; links: NavLink[]; extra?: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-sans text-sm font-semibold text-fg">{title}</h2>
      <ul className="mt-4 space-y-1.5">
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
    <footer className="mt-auto border-t border-border bg-surface">
      <Container className="pt-14 pb-10 lg:pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-[1.6fr_repeat(4,1fr)] lg:gap-10">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-muted">
              {site.tagline} Format, convert and edit files right in your browser.
            </p>
            <ul className="mt-5 space-y-2">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-fg-muted">
                  <Check aria-hidden size={15} strokeWidth={2.25} className="shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
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

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 text-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5">
            <ShieldCheck aria-hidden size={15} strokeWidth={1.75} />
            Your files are processed in your browser and never uploaded.
          </p>
        </div>
      </Container>
    </footer>
  );
}
