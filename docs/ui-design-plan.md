# UI Design Plan — All-in-One Tools Website

Status: **Phase 2 complete and restyled after review; homepage draft built early.** Phase 3 (directory + search) awaits approval.
Scope: frontend UI/UX and design infrastructure only. No backend, API, DB, auth, or real processing engines.

---

## 1. Current architecture (inspected 2026-10-18)

| Area | Finding |
|---|---|
| Repo layout | `frontend/` (React app) and `backend/` (stock Laravel 12 skeleton, untouched in this project phase). Root `package-lock.json` is empty. |
| Framework | **React Router v8.4 Framework Mode** (`@react-router/dev`, `react-router.config.ts`, `app/routes.ts`, route modules with `meta`). Not a plain Vite SPA, not Next.js. |
| Rendering | `ssr: true` — server-rendered via `@react-router/serve`. |
| React / TS | React 19.2, TypeScript 5.9 `strict`, path alias `~/* → app/*`. |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`; single `app/app.css` with `@theme { --font-sans: Inter }`. Inter loaded from Google Fonts. |
| Build | Vite 8. `npm run build` and `npm run typecheck` both pass on the starter. |
| Routes | One route: `index("routes/home.tsx")` rendering the starter `welcome/` screen. |
| Components | None beyond the starter welcome screen. No design system yet. |
| Icons | **No icon library installed.** |
| Lint / format | No ESLint or Prettier configured. Quality gate = `typecheck` + `build`. |
| Tests | None. |
| Agent assets | `frontend/.agents/skills/react-router/` (Framework Mode reference — use it when touching routing/rendering). No existing `CLAUDE.md`. |
| Deployment | `frontend/Dockerfile` (Node server). |

## 2. SEO evaluation

The project is **not** a client-only SPA, so the usual SPA SEO problem (empty HTML until JS runs) does not apply. React Router Framework Mode gives us, without any migration:

- Full HTML on first response (SSR), per-route `meta` exports for title/description/canonical/OG, `links` for canonical, crawlable `<Link>` → `<a href>`.
- Optional **build-time prerendering** (`prerender` in `react-router.config.ts`) for static public pages, with SSR kept for anything dynamic.

**Recommendation:** keep `ssr: true` and add `prerender` (list of known paths generated from the tool registry) in Phase 7 so marketing/category/tool pages ship as static HTML from the CDN while the Node server remains available. No framework change needed.

Laravel coexistence: Laravel should serve only the future API (e.g. `/api/*` on a subdomain or path). Public pages stay in React Router. Decide hosting topology before Phase 7 (see Risks).

## 3. Design system

> Update 2026-10-18 (second review: "make it more modern and attractive"): canvas is now bright neutral (#fafafb / #09090b), corners softer (6–20px), layered shadows, an orange→pink brand gradient (`bg-brand`, `text-brand`) for highlights, colourful category icon tiles (`--cat-*` hues), dotted hero background with glow, card hover lift, and slim themed scrollbars. Ink primary buttons, Bricolage Grotesque + Geist type and the token-only rule are unchanged. Sections 3.1–3.2 below describe the previous "workbench" pass.

Revised after review feedback ("too generic"): the first pass (Inter, indigo, pastel icon tiles) was replaced with a more distinctive identity.

### 3.1 Direction — "workbench"
Warm paper neutrals, ink-black primary actions, a single signal orange used sparingly (marks, focus, highlights), hairline-ruled grids instead of floating cards, numbered mono section labels, and a signature offset orange block behind feature panels. No gradients, no glass, no pastel tiles, no emoji icons.

### 3.2 Tokens (CSS variables in `app/app.css`, mapped into Tailwind `@theme`)
The default Tailwind palette is disabled; components use only semantic tokens.

| Group | Tokens |
|---|---|
| Surface | `bg` (#f5f4ef / #0f0f0d), `surface`, `surface-2`, `overlay` |
| Text | `fg`, `fg-muted`, `fg-subtle` |
| Lines | `border`, `border-strong` (≥3:1), `ring` |
| Accent | `accent` (#ff5a1f / #ff6a2b, fills only), `accent-fg` (text-safe), `accent-soft`, `on-accent` |
| Status | `success`, `warning`, `danger` + `-soft`; always with icon + text |
| Code | `code-key`, `code-string`, `code-number`, `code-punct` |
| Radius | sm 4px, md 6px, lg 8px |
| Shadow | `shadow-sm`, `shadow-lg` only |
| Width | `max-w-site` 82rem; gutters 16 / 24 / 32px |
| Utilities | `label-mono` (uppercase mono label), `z-header`, `z-popover` |

Primary button = ink (`bg-fg text-bg`); `accent` button variant reserved for one key CTA per view. All text pairs ≥ 4.5:1 in both themes (checked with a script).

### 3.3 Typography
- Display/headings: **Bricolage Grotesque** (tight tracking, fluid `text-hero`, `text-h1`, `text-h2`).
- UI/body: **Geist**. Code and labels: **Geist Mono**.
- Loaded from Google Fonts for now; self-host in Phase 7.

### 3.4 Theme
Light default; Dark and System options. Inline script sets `data-theme` before paint. Header toggle + System/Light/Dark radio group (footer, mobile menu).

### 3.5 Icons
`lucide-react`, 1.5 stroke, monochrome. Categories carry a three-letter mono code (DEV, PDF, IMG…) instead of colour coding.

## 4. Sitemap and page hierarchy

```
/                         Homepage
/tools                    Tools directory (search + category filter, ?q=&category=)
/:category                Category landing (developer-tools, pdf-tools, image-tools,
                          text-tools, converters, web-design-tools, generators, calculators)
/:category/:tool          Individual tool (e.g. /developer-tools/json-formatter)
/search?q=                (directory handles search; no separate page unless needed)
/about  /contact  /help   Supporting pages
/privacy  /terms          Legal pages (clearly marked placeholder text)
*                         404 with search + popular categories
```

Tool URLs are nested under their category for clear breadcrumbs and topical clustering. A static **tool registry** (`app/data/tools.ts`: slug, name, category, short description, keywords, status `available | demo | coming-soon`, related slugs) drives navigation, search, cards, related tools, breadcrumbs, sitemap, and prerender paths. Only tools with real content get indexable pages; `coming-soon` entries appear in listings but do not get thin standalone pages.

## 5. Component architecture

```
app/
  styles/            tokens.css (imported by app.css)
  data/              tools.ts, categories.ts (mock registry), faqs fixtures
  lib/               seo.ts (buildMeta: title, description, canonical, OG), theme.ts, cn.ts
  components/
    ui/              Button, IconButton, Link, Badge, Icon, Input, Textarea, Select,
                     Checkbox, Switch, SegmentedControl, Tabs, Tooltip, Alert,
                     Skeleton, Spinner, EmptyState, Dialog, Drawer, Kbd, VisuallyHidden
    layout/          SiteHeader, MainNav, MobileNav (drawer), SiteFooter, Container,
                     Breadcrumbs, SectionHeading, PageHeader, AdSlot
    search/          SearchField, CommandPalette (Ctrl/⌘K), SearchResults
    tools/           ToolCard, CategoryCard, ToolGrid, CategoryFilter,
                     ToolLayout (template), ToolWorkspace, EditorPanel (code shell),
                     PanelToolbar, CopyButton, FileDropZone, StatusBar,
                     RelatedTools, FaqSection, HowToSection
  routes/            home, tools, category, tool, about, contact, help, privacy, terms, not-found
```

Principles: tools are composed from `ToolLayout` + `ToolWorkspace` + panels, not built bespoke. Variants via small props (`variant`, `size`), no styling props soup. Headless behaviour (menus, dialogs, tabs) hand-rolled with correct ARIA; revisit a headless lib only if complexity demands it.

## 6. Responsive strategy

Mobile-first Tailwind breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, plus container queries for cards and editor panels.

- Header: full nav ≥ lg; menu button + drawer below. Search collapses to an icon that opens the command palette.
- Grids: `auto-fill, minmax(260px, 1fr)` so 1→2→3→4 columns without device hacks.
- Tool workspace: input/output side by side ≥ lg, stacked below; toolbars wrap, secondary actions move into an overflow menu under ~400px.
- Editors: fixed min-height, internal scroll, `overflow-x: auto` for long lines, optional soft-wrap toggle; page never scrolls horizontally.
- Touch targets ≥ 44×44px on coarse pointers.
- QA widths: 320, 375, 390, 430, 768, 1024, 1440, 1920.

## 7. SEO and accessibility strategy

SEO
- `buildMeta()` helper used by every route's `meta`: unique title (`{Tool} – {Brand}`), description, canonical, OG/Twitter.
- Semantic landmarks (`header/nav/main/footer`), one `h1` per page, logical heading order.
- Breadcrumbs visible + `BreadcrumbList` JSON-LD. Tool pages may use `WebApplication`/`SoftwareApplication` only with truthful fields (no ratings, no fake counts). `FAQPage` only where FAQs are visible on the page.
- Real helpful content on tool pages: how-to, examples, limitations, FAQ, related tools.
- `sitemap.xml` and `robots.txt` generated from the registry (resource routes) in Phase 7.
- Ad slot reserves fixed dimensions to avoid CLS; placed below the workspace.

Accessibility (WCAG 2.2 AA)
- Skip link, visible `:focus-visible` ring token, keyboard-operable menus/tabs/dialogs (focus trap, Esc, return focus), `aria-label` on icon buttons.
- Form labels and `aria-describedby` for errors; `role="status"`/`aria-live="polite"` for copy/format results.
- State never by colour alone (icon + text). `prefers-reduced-motion` respected. Target size ≥ 24px minimum, 44px on touch.

## 8. Implementation phases

| # | Scope | Done when |
|---|---|---|
| 1 | Inspect, evaluate, plan (this doc, `CLAUDE.md`) | ✅ |
| 2 | Tokens, typography, theme switch, global styles, base `ui/` primitives, header, mobile drawer, footer, root layout + error boundary restyle | ✅ (`/` is a temporary noindex design-system preview until Phase 3) |
| 3 | Tool registry mock data, homepage, `/tools` directory with search/filter and empty state, ToolCard/CategoryCard | as above + search keyboard flow |
| 4 | Category landing template, tool page template (`ToolLayout`, breadcrumbs, how-to/FAQ/related, ad slot) | as above |
| 5 | JSON Formatter prototype: editor shells, toolbar, empty/invalid/success/error states (demo-only formatting via `JSON.parse`, labelled as demo) | as above + states reachable by keyboard |
| 6 | About, Contact (non-submitting form, labelled), Privacy, Terms, Help, 404, responsive polish | as above |
| 7 | `buildMeta` across routes, JSON-LD, sitemap/robots, prerender config, self-hosted fonts, a11y + overflow QA pass | build + typecheck, manual a11y checklist, overflow check at all widths |

## 9. Risks and decisions

| Item | Decision / note |
|---|---|
| Icon library | `lucide-react` added in Phase 2 (approved). |
| Lint | No ESLint exists. Proposal: leave as-is; rely on `tsc` strict + build. Can add a minimal ESLint config later if wanted. |
| Hosting topology | React Router Node server (or static prerender) for pages, Laravel for `/api`. Needs a decision before Phase 7 (same domain via reverse proxy vs `api.` subdomain). Does not block Phases 2–6. |
| Brand name | No brand defined. Using a neutral placeholder wordmark (e.g. "Toolbench") until you choose one. |
| Fonts | Google Fonts Inter kept for now; self-host in Phase 7 for privacy/perf. |
| Demo honesty | JSON Formatter may use `JSON.parse/stringify` for realistic states; UI labels it as a prototype. Other tools show `coming-soon`. |
| Starter code | `app/welcome/` will be removed in Phase 2 when the real home route replaces it. |
