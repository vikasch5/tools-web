import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ArrowLeft, LayoutGrid, SearchX, TriangleAlert } from "lucide-react";

import type { Route } from "./+types/root";
import { SiteHeader } from "~/components/layout/SiteHeader";
import { SiteFooter } from "~/components/layout/SiteFooter";
import { Container } from "~/components/layout/Container";
import { ButtonLink } from "~/components/ui/Button";
import { CategoryIcon } from "~/components/ui/CategoryIcon";
import { categories, categoryPath } from "~/data/categories";
import { Link } from "react-router";
import { ads } from "~/config/site";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import geistLatin from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import bricolageLatin from "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2?url";
import "./app.css";

// Fonts are self-hosted (bundled from @fontsource), so no request goes to
// a third party. The Latin files used above the fold are preloaded.
export const links: Route.LinksFunction = () => [
  // Font preloads
  { rel: "preload", href: geistLatin, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "preload", href: bricolageLatin, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  // Favicons
  { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4338CA" />
        <meta property="og:image" content="https://alltoolsdesk.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        {ads.client && (
          <>
            {/* Site verification, plus the AdSense loader. Google's consent
                message for EEA/UK/Swiss visitors is served by this script once
                it is enabled under Privacy & messaging in AdSense. */}
            <meta name="google-adsense-account" content={ads.client} />
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.client}`}
              crossOrigin="anonymous"
            />
          </>
        )}
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col">
        <a
          href="#main"
          className="sr-only rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-popover"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  let title = "Something went wrong";
  let details = "An unexpected error occurred. Please try again.";
  let stack: string | undefined;

  if (notFound) {
    title = "Page not found";
    details =
      "This page does not exist, or it may have moved. Search the tools directory or pick a category below.";
  } else if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`;
    details = error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  const Icon = notFound ? SearchX : TriangleAlert;

  return (
    <Container className="py-20 sm:py-28">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted">
          <Icon aria-hidden size={22} strokeWidth={1.75} />
        </span>
        {notFound && (
          <p className="mt-6 font-mono text-sm font-medium text-accent-fg">404</p>
        )}
        <h1 className="mt-2 text-h1 font-semibold text-fg">{title}</h1>
        <p className="mt-3 text-fg-muted">{details}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/tools" variant="primary" icon={LayoutGrid}>
            Browse all tools
          </ButtonLink>
          <ButtonLink to="/" icon={ArrowLeft}>
            Back to home
          </ButtonLink>
        </div>
      </div>
      {notFound && (
        <nav aria-label="Categories" className="mx-auto mt-14 max-w-3xl">
          <h2 className="label-mono text-center font-sans text-fg-subtle">Or pick a category</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  to={categoryPath(c.slug)}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-surface p-3 text-sm font-medium text-fg shadow-sm transition-colors hover:border-border-strong"
                >
                  <CategoryIcon category={c} size="sm" />
                  {c.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {stack && (
        <pre className="mx-auto mt-12 max-w-3xl overflow-x-auto rounded-md border border-border bg-surface-2 p-4 font-mono text-xs text-fg-muted">
          <code>{stack}</code>
        </pre>
      )}
    </Container>
  );
}
