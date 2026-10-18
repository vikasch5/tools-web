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

### PR #5: Password Generator, QR Code Generator, Case Converter, Lorem Ipsum (batch 3 complete)
- **Password Generator**:
  - Lengths from 4 to 128, choice of character sets, and an option to avoid look-alikes.
  - Every chosen set is included at least once.
  - Uses `crypto.getRandomValues` with rejection sampling, so there is no modulo bias.
  - Strength is shown as a label plus bits, with an offline crack-time estimate.
- **QR Code Generator**:
  - Content can be a link or text, or a Wi-Fi login (with escaping, WPA/WEP/open, hidden networks).
  - L/M/Q/H error correction and custom colours, with a low-contrast warning.
  - PNG export at 512, 1024 or 2048 px, plus SVG export.
  - New dependency: `uqr` 0.1.3 (zero dependencies).
- **Case Converter**:
  - Shows all 11 cases at once with copy buttons.
  - Title Case is smart about minor words. Code cases split acronyms and digits and work line by line.
- **Lorem Ipsum Generator**:
  - Generates paragraphs, sentences or words, with an optional classic opening and HTML `<p>` output.
  - Copy or download the result.
  - Uses a seedable PRNG so tests are repeatable.
- Verified:
  - Typecheck, 143 tests and the build all pass.
  - Browser run: clipboard copy, the symbols toggle, word count, Wi-Fi QR and PNG download all work.
  - No horizontal scroll at 375px and no console errors.
- All 11 batch 3 tools are now live, and the site has 31 tools.

### PR #6: launch readiness (sitemap, robots, self-hosted fonts)
- `/sitemap.xml` and `/robots.txt` are resource routes, prerendered at build time.
  - The sitemap lists every public page (home, static pages, categories, all 31 tools) from `app/lib/pages.ts`.
  - The prerender list in `react-router.config.ts` uses the same file, so the two cannot drift apart.
- Fonts are now self-hosted via `@fontsource-variable` (Geist, Geist Mono, Bricolage Grotesque with the optical-size axis) instead of Google Fonts.
  - The Latin files are preloaded.
  - The Privacy page now says no third-party requests are made.
- Verified:
  - Typecheck, 145 tests and the build all pass.
  - Browser check: all three fonts load, and no external requests are made on the home, JSON and PDF pages.
  - Sitemap and robots return 200.
- **Before going live:**
  - Build with `VITE_SITE_URL=https://<real-domain>`. Canonical URLs, the sitemap and robots.txt use it; the placeholder is `https://toolbench.example`.
  - Replace the placeholder brand name and contact email.
  - Get Privacy and Terms legally reviewed.
  - Choose hosting. The build output is a Node server (`react-router-serve`) plus static prerendered pages.

### PR #7: AdSense readiness
- Audit (what was already in place): About, Contact, Privacy, Terms and Help pages; footer links on every page; sitemap and robots.txt; canonical, Open Graph and Twitter tags; self-hosted fonts and prerendered pages; categories with no live tools are `noindex`.
- **Ads, off by default.** Nothing ad-related ships until `VITE_ADSENSE_CLIENT` is set at build time (see `frontend/README.md`).
  - Loads the AdSense script asynchronously and adds the `google-adsense-account` verification tag.
  - `/ads.txt` is prerendered from the publisher ID (`google.com, pub-…, DIRECT, f08c47fec0942fa0`). A malformed ID fails the build.
  - `AdSlot`: a labelled responsive unit, two per tool page (below the workspace and after the guide, never next to tool controls) and one per category page. Space is reserved (250/280 px) so the page does not shift when the ad loads. It refills on client-side navigation.
- **Consent (EEA/UK/Switzerland).** Uses Google's own certified CMP, which the AdSense script serves once the GDPR message is published in AdSense → Privacy & messaging. A "Privacy and cookie settings" footer link reopens it so visitors can withdraw consent.
- **Privacy policy and terms.** Privacy now has Advertising and cookies (Google and third-party vendor cookies, links to Google's partner-sites policy, My Ad Center and aboutads.info, consent for EEA/UK users), Children and Changes sections with a last-updated date. The advertising text appears only when ads are enabled, so the policy stays truthful. Terms gained an Ads and links section.
- **Share cards.** `public/og-image.png` (1200×630, source in `frontend/scripts/og-image.html`), plus `og:image` with size and alt, `og:locale`, and `twitter:card=summary_large_image`.
- **Content depth.** Every tool page has a new "About the …" section (2 original paragraphs on what the tool is for and when to use it). Tool pages now carry roughly 380–630 words of text each. Tests require an overview of at least 80 words and 3 FAQs per tool.
- Verified: typecheck, 150 tests and the build pass. Browser run with a test publisher ID: two slots per tool page reserve 280 px, they refill after client-side navigation, the consent link queues Google's revocation message, and there are no console errors. Without the ID, the built HTML has no ad code.
- **Needs Vikas before applying to AdSense:**
  - A real domain (AdSense reviews a live site; subdomains and free hosts are often refused) and `VITE_SITE_URL` set to it.
  - Replace the placeholder brand and contact email, and remove the "Draft" notices and the footer's "Design prototype" label. Reviewers treat placeholder content as an unfinished site.
  - Create the AdSense account, then build with `VITE_ADSENSE_CLIENT` and, after creating a display ad unit, `VITE_ADSENSE_SLOT`.
  - In AdSense → Privacy & messaging, publish the European regulations (GDPR) message and, optionally, the US state regulations message.
  - Add the site in Google Search Console and submit the sitemap.

### PR #8: seven high-demand tools (batch 4, 38 tools live)
- **JPG to PDF** (`/pdf-tools/image-to-pdf`): one image per page on A4, Letter or a page the size of the image, with auto/portrait/landscape and three margins. Upright JPEGs and PNGs are embedded unchanged; other formats and EXIF-rotated phone photos are redrawn as JPEG first (a small EXIF reader decides). Up to 100 images.
- **Unix Timestamp Converter**: seconds, ms, µs or ns (guessed from the number's size, or chosen), or date text, to ISO 8601, UTC, local time and relative time. Live clock and "Use current time".
- **Hash Generator**: MD5 (own RFC 1321 implementation, since Web Crypto lacks it), SHA-1, SHA-256, SHA-384 and SHA-512 for text or files up to 200 MB, plus checksum comparison that names the matching algorithm.
- **Color Converter**: HEX, RGB, HSL, HSV and CMYK from any of HEX, rgb(), hsl() or basic names, a colour picker, and WCAG contrast against white and black.
- **Age Calculator**: exact years, months and days on any date, totals, and the next birthday (29 February counts as 28 February in common years).
- **BMI Calculator**: metric or US units, WHO adult categories and the healthy weight range for the height, with the limits of BMI stated on the page.
- **Loan & EMI Calculator**: standard amortised payment, total interest and a yearly schedule; any currency.
- `FileDrop` now takes any file when `accept` is empty (used by the hash tool). Category descriptions updated to match what each category really holds.
- Verified: typecheck, 171 tests and the build pass. Engine tests use RFC/NIST hash vectors, the textbook mortgage payment (200,000 at 6% for 30 years = 1,199.10) and leap-day ages; every published example is checked against real output. Browser run: all seven work, a 2-image PDF came out with landscape and portrait A4 pages, no console errors, no horizontal scroll at 375 px.
