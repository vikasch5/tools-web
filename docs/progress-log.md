# Progress log

A running record of what was built, in order. Add a short entry after every chunk of work, with each PR merged into `main`.

Plan order: the remaining tools, then site pages, then batch 3 tools (one at a time), then launch readiness. Hosting and the domain still need a decision from Vikas.

## 2026-10-18

### PR #1: the remaining 14 tools (merged)
- Built the 14 "Coming soon" tools across the developer, text, PDF, image and calculator categories. All of them run in the browser through the engine worker.
- Added two dependencies: `sql-formatter` and `pdf-lib`.
- Every published example is tested against real engine output.
- Details are in `docs/tools-plan-batch-1.md` §11.

### PR #2: tools directory, quick search and site pages
- `/tools` directory page:
  - Ranked search (`app/lib/search.ts`) that matches name, keywords, slug, category and description.
  - Category chips with counts, and an empty state with suggestions.
  - Typing `/` focuses the search box.
  - The search and category are kept in the URL (`?q=`, `?category=`).
- Quick search palette in the header:
  - Opens with Ctrl/⌘K and is fully usable from the keyboard.
  - Without JavaScript, the trigger falls back to a plain link to `/tools`.
- New pages: About, Help (FAQ and shortcuts), Contact, Privacy and Terms.
  - Contact opens the visitor's mail app. The email address is a placeholder and is labelled as one.
  - Privacy and Terms are marked as drafts that have not been legally reviewed.
- The 404 page now links to every category.
- Search keywords added to all 20 tools.
- Verified:
  - Typecheck, 87 tests and the build all pass.
  - Browser smoke test: search, filters, palette, and every page has exactly one h1.
  - No horizontal scroll at 375px and no hydration errors.

### PR #3: batch 3, first four developer and data tools
- **HTML Minifier**:
  - Removes comments, keeping conditional and `<!--!` comments.
  - Drops whitespace next to block-level tags and collapses it between inline elements.
  - Keeps `<pre>` and `<textarea>` content exactly as written.
  - Minifies inline CSS with csso and inline JS with terser, without renaming top-level names. JSON scripts are compacted.
  - Broken scripts are left as they are and listed as warnings.
- **XML Formatter & Validator**:
  - Format, minify and validate, backed by an in-house well-formedness parser.
  - Errors report line and column: mismatched tags, unquoted or repeated attributes, bare `&` or `<`, more than one root.
  - SVG, RSS and plist files are accepted.
- **YAML ⇄ JSON Converter** (converters category):
  - Uses the new `yaml` dependency (2.9.1).
  - Handles anchors and merge keys, and turns multi-document files into a JSON array.
  - Alias bombs are rejected.
  - Download uses `.json` or `.yaml` depending on the direction.
- **URL Encode / Decode**:
  - Component, Full URL and Form (+) styles.
  - Broken `%` escapes report their position.
  - "Parse URL" splits a URL into its parts and decoded query parameters, with the password hidden.
- Shared changes:
  - Actions can set their own download extension.
  - Text tools can set a custom input placeholder.
- Verified: typecheck, 116 tests and the build all pass. A browser run of each tool's sample and secondary actions showed no console errors.

### PR #4: Image Converter, Rotate PDF, PDF to Image
- **Image Converter**:
  - Converts JPG, PNG, WebP, GIF, BMP, AVIF and ICO into JPG, PNG or WebP.
  - Quality control for lossy formats, and a white or black fill for transparency when saving as JPG.
  - Batches of up to 30 images, downloaded as a ZIP. A note appears when the browser cannot save the chosen format.
- **Rotate PDF**:
  - Shows page previews with per-page and all-page left/right turns, plus Reset.
  - Only each page's `/Rotate` setting changes (pdf-lib), so text and quality are untouched.
- **PDF to Image**:
  - Click previews to choose pages. Output is PNG, JPG or WebP at 72, 150 or 300 DPI.
  - One page downloads as an image; several come as a ZIP. Names are zero-padded so files sort in page order.
  - Pages over 40 megapixels are scaled down, with a warning.
- New dependency: `pdfjs-dist` 6.4.299.
  - Uses the **legacy build**, because the modern build needs `Map.getOrInsertComputed`, which current Chromium lacks.
  - Loaded only on PDF preview pages.
  - Fonts, cmaps, colour profiles and decoders are served same-origin from `/pdfjs/` by a small Vite plugin, with no CDN.
- Verified:
  - Typecheck, 122 tests and the build all pass.
  - Browser run: rotated pages read back as 0/90/270/0.
  - A 3-page ZIP and a 300 DPI JPG at the expected pixel size downloaded correctly.
  - Image conversion works, with no console errors.
