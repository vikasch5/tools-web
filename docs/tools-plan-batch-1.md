# Tools Plan — Batch 1: Code Formatters & Minifiers

Status: **Built (local, uncommitted).** Decisions: separate formatter/minifier pages, enhanced textarea editor, prettier + terser + csso + vitest approved.
Goal: ship the first set of *working* developer tools on top of the existing design system, and build the shared tool framework every later tool reuses.

---

## 1. Scope

### Batch 1: six tools, all processed in the browser

| # | Tool | URL | Actions | Engine |
|---|---|---|---|---|
| 1 | JSON Formatter & Validator | `/developer-tools/json-formatter` | Format, Minify, Validate, sort keys, indent 2/4/tab | Native `JSON.parse` + custom error locator (line/column) |
| 2 | CSS Formatter | `/developer-tools/css-formatter` | Beautify CSS / SCSS / Less, indent options | Prettier (standalone + postcss plugin) |
| 3 | CSS Minifier | `/developer-tools/css-minifier` | Minify, show bytes saved | csso |
| 4 | JavaScript Formatter | `/developer-tools/js-formatter` | Beautify JS / TS, semicolons, quotes, indent | Prettier (babel + typescript plugins) |
| 5 | JavaScript Minifier | `/developer-tools/js-minifier` | Minify, optional mangle, show bytes saved | Terser |
| 6 | HTML Formatter | `/developer-tools/html-formatter` | Beautify HTML, indent options | Prettier (html plugin) |

**Why separate formatter and minifier pages:** people search for them separately ("css minifier" vs "css beautifier"), and each page gets its own instructions, examples and FAQ. That keeps them genuinely different, not thin duplicates. Each page links to its counterpart ("Need it smaller? Minify CSS →").

### Batch 2 (next, reusing the same framework)
HTML Minifier, SQL Formatter (`sql-formatter`), XML Formatter, YAML ⇄ JSON, Base64 encode/decode, URL encode/decode, JWT Decoder, UUID Generator.

### Out of scope for Batch 1
Backend, accounts, saving snippets to a server, file uploads over 5 MB, and AI features.

## 2. Engines and bundle strategy

| Library | Version | Used for | Loading |
|---|---|---|---|
| none (native) | — | JSON | in the route chunk |
| `prettier` | 3.9 | CSS, JS/TS, HTML formatting | **lazy**: dynamic `import()` of `prettier/standalone` plus only the plugin a page needs |
| `terser` | 5.51 | JS minify | lazy, JS Minifier page only |
| `csso` | 5.0 | CSS minify | lazy, CSS Minifier page only |

- No engine code goes in the shared bundle. Each engine loads on first use (or idle-prefetches on its own page), so the homepage stays light.
- Processing runs in a **Web Worker** (Vite `?worker`) so big files never freeze the page. A small `runEngine(tool, action, input, options)` API hides the worker.
- Everything stays on the user's device. That makes **"Your code never leaves your browser"** a true claim we can show on the page.
- Bundle sizes get measured after the build and recorded here. The budget is under 60 KB gzip of JS per tool page before an engine loads.

## 3. Shared tool framework

### 3.1 Data
`app/data/tools.ts` (registry) gains engine metadata, and each tool gets a content file:

```ts
// app/content/tools/css-minifier.ts
export default {
  slug: "css-minifier",
  title: "CSS Minifier",
  metaTitle: "CSS Minifier – Compress CSS Online",
  description: "...",          // meta description + intro
  engine: "csso",
  actions: ["minify"],
  options: [...],              // rendered as controls
  sample: "...",               // "Load sample" input
  howTo: [...], examples: [...], faq: [...], limitations: [...],
  related: ["css-formatter", "js-minifier", "html-formatter"],
};
```

### 3.2 Route
One dynamic route `/:category/:tool` (`routes/tool.tsx`). Its loader looks the tool up in the registry and throws 404 when it's unknown. Its `meta` builds a unique title, description, canonical and OG tags. The tool list also feeds build-time **prerendering**, so every tool page ships as full HTML.

### 3.3 Components (new)
| Component | Job |
|---|---|
| `ToolLayout` | Breadcrumbs, H1, intro, workspace slot, ad slot below the tool, content sections, related tools |
| `ToolWorkspace` | Two panes (input / output) side by side from `lg`, stacked below; owns state |
| `CodePane` | Editor shell: header with label and language, line numbers, monospace textarea, soft-wrap toggle, char/line/byte count |
| `ToolToolbar` | Primary action (Format/Minify), option controls, secondary actions overflow on mobile |
| `CopyButton`, `DownloadButton`, `FileOpenButton` | Shared actions with success feedback via `aria-live` |
| `StatusBar` | Idle / working / success (size before→after, % saved) / error (message + line:col, jump to line) |
| `SegmentedControl`, `Select`, `Switch` | Option controls |
| `HowTo`, `FaqSection`, `RelatedTools` | Content blocks below the tool |

### 3.4 Behaviour (all tools)
- Buttons: **Format/Minify** (primary), **Copy**, **Download**, **Open file**, **Load sample**, **Clear**.
- `Ctrl/⌘ + Enter` runs the main action.
- Paste or drop a file into the input. Accepts `.json/.css/.js/.ts/.html` up to 5 MB.
- Errors show the message plus line and column, and highlight the line in the input. State is always conveyed with an icon plus text, not colour alone.
- Options are remembered per tool in `localStorage` (indent size and so on). Input text is **not** stored by default.
- The URL stays clean: no input data in query strings.

## 4. Editor choice (decision needed)

| Option | Pros | Cons |
|---|---|---|
| **A. Enhanced textarea** (recommended for Batch 1) | ~0 KB, fast, native mobile keyboard and selection, accessible by default | No syntax colouring in the input pane |
| B. CodeMirror 6 | Syntax highlighting, folding, inline error marks | ~120–150 KB gzip per page; mobile editing quirks |

Recommendation: start with **A**, and colour only the *output* pane with a tiny tokenizer for JSON/CSS. CodeMirror can be lazy-loaded later as an opt-in "advanced editor" if we want it.

## 5. SEO and content per tool
- Unique H1, title, description, canonical URL and OG tags.
- Server-rendered or prerendered, so the instructions, examples and FAQ are in the HTML.
- `BreadcrumbList` and `FAQPage` JSON-LD only for content that is actually visible on the page. `SoftwareApplication` JSON-LD without ratings or fake counts.
- Internal links to the formatter/minifier counterpart, related tools, and the category page.
- No thin variant pages (e.g. no separate "JSON beautifier" page that duplicates the formatter).

## 6. Accessibility and responsiveness
- Labelled panes and controls, visible focus, keyboard-only flow tested.
- Results are announced through `role="status"`.
- Panes stack below `lg`. On phones the input gets a fixed comfortable height, output is scrollable, and the toolbar wraps with secondary actions in a "More" menu.
- Long lines scroll inside the pane, never the page.
- QA at 320 / 375 / 768 / 1024 / 1440 in light and dark.

## 7. Build order

| Step | Work | Done when |
|---|---|---|
| 1 | Tool framework: dynamic route, `ToolLayout`, workspace, panes, toolbar, status, content blocks, worker runner | Template renders for a stub tool at all widths |
| 2 | **JSON Formatter & Validator** with full content | Format/minify/validate work; errors show line:col; tests pass |
| 3 | **CSS Formatter + CSS Minifier** | Prettier and csso lazy-load in the worker; size savings shown |
| 4 | **JS Formatter + JS Minifier** | Prettier JS/TS and Terser; syntax errors located |
| 5 | **HTML Formatter** | Prettier HTML |
| 6 | Category page for Developer Tools, prerender list, bundle size check, a11y and responsive QA | Build + typecheck pass, sizes recorded |

Testing: add **Vitest** (dev dependency only) for the engine adapters, e.g. "invalid JSON reports line 3, col 7" or "minified CSS is smaller and still parses". UI is checked manually in the browser at the widths above.

## 8. New dependencies (need approval)
- Runtime (lazy-loaded, per tool): `prettier`, `terser`, `csso`
- Dev: `vitest`

## 9. Open decisions
1. **Pages:** separate formatter and minifier pages (recommended), or one combined page per language?
2. **Editor:** enhanced textarea (recommended), or CodeMirror now?
3. **Batch 1 list:** are these six right, or do you want to swap any (e.g. add SQL Formatter, drop HTML Formatter)?

## 10. Implementation notes (as built)

- Engines: `app/tools/engine/` (`run.ts` entry, `json.ts` + `json-scan.ts` for error locations, `engine.worker.ts`, `client.ts`). Vite `worker.format = "es"` so engines code-split inside the worker.
- Definitions: `app/tools/defs/*` (content + options), `app/tools/registry.ts`; public list with `status: live | soon` in `app/data/tools.ts`.
- UI: `components/tool/` (`ToolWorkspace`, `CodePane`, `OptionControls`, `ToolContent`), routes `routes/tool.tsx` and `routes/category.tsx`, SEO helper `lib/seo.ts`.
- Prerendered: `/`, all 8 category pages (empty ones are `noindex`), and the 6 tool pages.
- Tests (`npm test`, 28): engine behaviour, error locations, and every published example/sample is checked against real engine output.
- Engine download on first use (gzip): CSS formatter ≈ 68 KB, JS formatter ≈ 168 KB (TypeScript adds ≈ 270 KB only when chosen), HTML formatter ≈ 260 KB, JS minifier ≈ 136 KB, CSS minifier ≈ 59 KB, JSON 0 KB. Tool page JS before engines ≈ 7 KB gzip on top of the shared app shell.
- Known gaps: output pane has no syntax colouring; `site.url` is a placeholder (`VITE_SITE_URL`) so canonicals point at toolbench.example until a domain is set; /tools, /help, /about and legal pages still 404.
