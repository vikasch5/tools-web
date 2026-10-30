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

### Batch 5: nine high-demand PDF tools (47 tools live)
- Decisions (approved): Office conversions stay in the browser, so "nothing is uploaded" remains true for every tool. Excel and PowerPoint to PDF are left out, since doing them well needs a server.
- **Compress PDF**: Lossless (qpdf repacks streams and objects), Recommended (JPEGs over 2000 px scaled down and re-encoded at 72%, other images turned into JPEG when smaller) and Strong (1400 px, 50%). Text and vectors are untouched. Never returns a bigger file; under 1% saving is reported as "already packed".
- **Word to PDF**: docx-preview lays the .docx out in the page, then the browser's "Save as PDF" printer writes a real PDF with selectable text. Files saved by Word keep Word's page breaks, headers and footers; files without saved page breaks (Google Docs, LibreOffice exports) are paginated by the browser with the document's margins, and headers and footers are left out (the page says so). Symbol and Wingdings bullets are mapped to Unicode so they show on phones and Macs.
- **PDF to Word**: pdf.js text → lines → paragraphs, headings (by size against the body size), list items, bold and italic, one Word page per PDF page; sideways pages are turned upright first. Own minimal .docx writer (no new dependency). Scans without text get a clear "needs OCR" message.
- **Organize PDF** (drag or arrow buttons to reorder, turn, remove) and **Delete PDF Pages** (click previews or type ranges; both stay in sync).
- **Add Page Numbers**: six positions, four formats, start number, pages to number (e.g. 2- to skip a cover), live preview; correct on rotated pages.
- **Watermark PDF**: text in any script (drawn with the device's fonts, so Hindi works) or a logo; colour, size, opacity, angle, once or repeated, chosen pages; live preview.
- **Protect PDF** (AES-256 open password) and **Unlock PDF** (needs the password; files that only restrict printing or copying are detected and unlocked without one).
- New dependencies: `@neslinesli93/qpdf-wasm` 0.3.0 (qpdf 12.2, ISC/Apache-2.0, 1.3 MB wasm, loaded only by Compress/Protect/Unlock) and `docx-preview` 0.4.1 (Apache-2.0, Word to PDF only).
- Verified: typecheck, 201 tests and the build pass; every published example is checked against real engine output (including real AES-256 encrypt/decrypt through qpdf). Browser run on the production build (18/18): downloads checked with pypdf (page order, rotations, numbers on the right pages, encryption, decryption), the .docx contents, a real PDF printed from a Word file (text, Hindi, table, image, bullets), no horizontal scroll at 375 px, no console errors.

### Batch 5 follow-up: Word to PDF downloads directly
- No print window any more. The document is laid out with docx-preview, split into page-sized boxes at paragraph and table-row boundaries (headers and footers repeated on every page, also for files without Word's saved page breaks), drawn at 192 DPI with `modern-screenshot` (MIT, no dependencies), and written to a PDF in the worker with an invisible Helvetica text layer, one run per line, so Latin-script text can be searched and copied.
- The preview now shows exactly the pages that will be saved.
- New dependency: `modern-screenshot` 4.7.0, loaded only by Word to PDF.
- Verified: 202 tests, typecheck and build pass; browser run 17/17, including a direct download of a 3-page Word file (headers on every page, text layer reads as sentences) and no print call.

### Clearer actions and safe deploys
- **Main button in a bar at the bottom of every file tool** (`Panel` `action` + `PrimaryAction`): large, full width on phones, and it stays at the bottom of the screen while the tool is in view, so it never scrolls out of reach on long settings. Options stay in the top toolbar. Disabled buttons say why next to them ("Add at least two PDFs", "Turn at least one page first"). Two-step tools (Compress PDF, Resize Image) show one button that changes to "Download …" when the result is ready. Used by all 18 file tools; instant tools (text, generators, calculators) are unchanged.
- **Deploys can no longer take the site down.** `prebuild` (`scripts/check-deps.mjs`) stops `npm run build` before it deletes `build/` when dependencies are missing or differ from the lockfile. `npm run deploy` (`scripts/deploy.sh`) runs `npm ci`, builds into `build-next/`, checks it, then swaps it in and keeps `build-previous/` for rollback. `buildDirectory` reads `BUILD_DIR`.
- Apache `.htaccess` in the build (`.mjs`/`.wasm` types, trailing-slash handling, no directory listings).
- Verified: 202 tests, typecheck and build; browser run 17/17 for the batch 5 tools plus a download check of all nine older file tools; deploy tested end to end and with a missing dependency (site left intact).

### Compress image to an exact size (roadmap phase 1, tool 1)
- **Size limit mode** in Compress Image: pick Under 10 KB … 2 MB or a custom limit (5–20,000 KB). Each image gets the highest quality that fits; the image keeps its size while quality stays at 70% or more, and is made smaller only when that is not enough (largest fitting size found by search, then quality raised as far as it fits). Quality drops below 70% only at the smallest size. Never goes over the limit. 1 KB = 1,000 bytes, so files pass forms that count 1,000 or 1,024.
- Images already under the limit are kept unchanged. PNGs are saved as JPG in this mode (labelled). Browsers without a WebP encoder fall back to JPG before the search starts.
- **Seven landing pages**: `/image-tools/compress-image-to-{10,20,30,50,100,200,500}kb`. Each opens the same widget with the limit preset, and has its own title, description, guide and FAQ about where that limit is used. They are in the sitemap and in search results, but not in category listings or tool counts (`toolVariants` in `data/tools.ts`, `preset` on widget definitions).
- Verified: typecheck, tests and build pass (new `image-target.test.ts` with fake encoders, including a size curve unlike scale²). Browser run on the production build at 375 px and 1280 px: an 8.3 MB photo and a 16.5 MB PNG both came out at 49.2 KB (72% quality, 680 × 906 px) on the 50 KB page and 19.8 KB on 20 KB; a 2.5 KB file was kept; ZIP download works; no horizontal scroll.

### Exam photo and signature resizer (roadmap phase 1, tools 2 and 3)
- **Exam Photo & Signature Resizer** (`/image-tools/exam-photo-resizer`, new `form-photo` widget): pick a form and upload type; the image is cropped to the exact shape, resized to the exact pixels, and saved as the best-quality JPG inside the KB range (max counted at 1,000 bytes/KB, min at 1,024, so both conventions pass). Results below a minimum are padded with a JPEG comment segment (picture unchanged). Custom size for other notifications.
- Presets (`engine/form-photo.ts`, checked Oct 2026): bank exams (IBPS/SBI/RBI) photo 200×230 20–50 KB, signature 140×60 10–20 KB, thumb 240×240 20–50 KB, declaration 800×400 50–100 KB (Punjab & Sind Bank notice); SSC signature 10–20 KB (photo is now captured live by SSC); UPSC photo 20–200 KB, signature 20–100 KB; India Post GDS photo 320×400 30–100 KB, signature 300×120 20–100 KB; PAN photo 3.5×2.5 cm ≤20 KB (stricter of the published 20/30 KB), signature 2×4.5 cm ≤10 KB. The page says to confirm against the user's own notification.
- **Signature Resizer** (`/image-tools/signature-resizer`, same widget, signature presets only): finds the ink, fits it into the output shape with an adjustable margin (white beyond the image edge), whitens the paper and darkens the ink. The preview approximates the clean-up.
- **Landing pages** (variants of the resizer): `pan-card-photo-resizer`, `ibps-photo-signature-resizer`, `upsc-photo-resizer`, `india-post-gds-photo-resizer`.
- Passport Photo now uses the shared `CropFrame` (drag, arrow keys, guides).
- Verified: typecheck, 234 tests, build. Browser run at 375 and 1280 px: every preset downloaded at its exact pixel size inside its KB range (e.g. bank photo 200×230 at 21.0 KB after padding, PAN signature 354×157 at 6.6 KB, UPSC photo 37.6 KB); cleaned signature checked by eye; passport photo still downloads 600×600 after dragging; no page errors, no horizontal scroll.

### EMI calculator with prepayment (roadmap phase 1, tool 4)
- **Prepayments** in Loan & EMI Calculator: extra every month, a yearly lump sum from a chosen year, and a one-time payment in a chosen month, used either to finish sooner (EMI kept) or to lower the EMI (end date kept, EMI recalculated after each prepayment). Shows interest saved, new tenure or final EMI, total prepaid, and the interest without prepaying.
- **Schedule** by year or by month, with a CSV download (Month, EMI, Principal, Interest, Prepayment, Balance).
- **Landing pages** in rupees with Indian digit grouping (₹50,00,000): `/calculators/home-loan-emi-calculator` (₹50 lakh, 8.5%, 20 y), `car-loan-emi-calculator` (₹8 lakh, 9%, 5 y), `personal-loan-emi-calculator` (₹5 lakh, 12%, 3 y). Each has its own guide and a loan-specific FAQ (e.g. RBI's no-foreclosure-charge rule for floating-rate home loans).
- Segmented labels no longer wrap.
- Verified: typecheck, 245 tests (new `loan-prepay.test.ts`; base EMIs match standard values, e.g. ₹50 lakh at 8.5% for 20 years = ₹43,391.16), build. Browser run at 375 and 1280 px: ₹1 lakh a year saves ₹18,55,389.33 and ends 6 years early; EMI mode, monthly view (240 rows) and CSV download work; no horizontal page scroll, no errors.

### Compress PDF to an exact size (roadmap phase 1, tool 5)
- **Size limit mode** in Compress PDF (Under 100 KB … 5 MB). Tries, gentlest first: lossless repacking, then JPEG images at 72%/2000 px, 50%/1400 px, 40%/1100 px, 30%/800 px; the first result under the limit wins, so text and vectors stay real text. Files already under the limit are kept.
- If no step fits, the page explains the trade-off and offers **"Turn pages into images"**: pages are rendered with pdf.js (150 DPI at 75% down to 50 DPI at 35%) and rebuilt at their original page sizes (`pagesToPdf`), so the PDF looks the same but text is no longer selectable. Up to 60 pages.
- **Landing pages**: `/pdf-tools/compress-pdf-to-{100kb,200kb,500kb,1mb}`, each with its own guide.
- Verified: typecheck, 254 tests (new `pdf-target.test.ts`), build. Browser run: an 11.7 MB 3-page scan → 181 KB on the 1 MB page and 55.6 KB on the 100 KB page (text kept, A4 pages); a 5 MB PDF with Flate images → offered page images → 131 KB at 72 DPI on the 200 KB page, 2 A4 pages; 375 px without horizontal scroll; no errors.

### Indian finance calculators (roadmap phase 2, tools 7–13)
- Seven new calculators in `engine/finance.ts` (pure, tested) with rupee formatting (₹12,34,567): **GST** (add/remove, 5/18/40%, 3% gold, 0.25% diamonds or any rate; CGST+SGST or IGST), **SIP** (monthly with optional yearly step-up, or lump sum), **FD** (quarterly compounding by default, quarterly-payout alternative), **Compound Interest** (same widget with monthly additions, preset `kind: compound`), **PPF** (₹500–₹1.5 lakh a year, 7.1%, 15 years + 5-year extensions), **Gratuity** (15/26 with 6-month rounding when covered by the Act, 15/30 otherwise, 5-year / 1-year fixed-term eligibility, ₹20 lakh tax-free), **HRA** (least of the three limits, 50% in the 8 cities from April 2026, old regime only).
- Shared `finance-shared.tsx`: headline figure, invested-vs-returns bar (labelled with percentages, not colour only) and a year-by-year table.
- Rules checked Oct 2026: GST slabs after the 22 Sep 2025 reform (Business Standard), PPF 7.1% for Oct–Dec 2026 (Angel One), HRA 8 cities and no HRA in the new regime (Cleartax, Moneylife), gratuity under the Code on Social Security (PocketHRMS).
- Verified: typecheck, 279 tests (new `finance.test.ts`; SIP ₹10,000 × 10 y at 12% = ₹23,23,391, PPF ₹1.5 lakh × 15 y = ₹40,68,209, FD ₹1 lakh × 5 y at 7% = ₹1,41,477.82 match published calculators), build. Browser run of all seven at 375 and 1280 px: correct headline figures, no horizontal scroll, interactions (GST removal across states, SIP step-up, gratuity eligibility) work, no errors.

### Income tax calculator, new vs old regime (roadmap phase 2, tool 6)
- `/calculators/income-tax-calculator`: FY 2026-27 (AY 2027-28) tax under both regimes side by side, which one is lower and by how much (yearly and monthly), with a full breakdown: gross income, deductions, taxable income, slab tax, 87A rebate, surcharge, 4% cess, total and effective rate.
- Rules in `engine/income-tax.ts` (Budget 2026 kept FY 2025-26 rates): new slabs 0/5/10/15/20/25/30% at ₹4/8/12/16/20/24 lakh, ₹75,000 standard deduction, 87A rebate up to ₹60,000 for taxable income ≤ ₹12 lakh with marginal relief above it; old regime slabs by age (below 60, 60–79, 80+), ₹50,000 standard deduction, ₹12,500 rebate up to ₹5 lakh (no marginal relief); surcharge 10/15/25/37% above ₹50 lakh/1/2/5 crore (capped at 25% in the new regime) with marginal relief at each threshold.
- Old regime deductions: 80C (capped ₹1.5 lakh), 80D, own NPS 80CCD(1B) (capped ₹50,000), exempt HRA, home loan interest (capped ₹2 lakh), other; employer NPS 80CCD(2) in both regimes. Capital gains and other special-rate income are out of scope (stated on the page).
- Verified: typecheck, 292 tests (new `income-tax.test.ts`: ₹12.75 lakh salary pays ₹0 new; ₹15 lakh pays ₹97,500 new / ₹2,57,400 old; marginal relief at ₹12.1 lakh → ₹10,400; surcharge relief at ₹50.01 lakh), build. Browser run at 375 and 1280 px, including a ₹25 lakh case where the old regime wins by ₹15,600; no errors, no horizontal scroll.

### Crop Image and Add Text to Photo (roadmap phase 3, tools 14–15)
- **Crop Image** (`/image-tools/crop-image`): crop box with 8 handles and rule-of-thirds guides; ratios Free, 1:1, 4:5, 3:4, 4:3, 16:9, 9:16; exact width/height/left/top in pixels; rotate left/right and mirror (applied before the crop, in the worker: `turn`/`flip` on `ImageJob`); keyboard: arrows move, Shift + arrows resize. Cut from the full-resolution original. Geometry in `engine/crop-geometry.ts` (tested).
- **Add Text to Photo** (`/image-tools/add-text-to-photo`): several text layers, drag on the photo or use sliders to place them; font (Sans, Display, Serif, Mono, Handwriting, with Devanagari fallbacks), size as % of the shorter side, colour, bold, automatic contrasting outline; one-click date stamp. Drawn at full resolution; Hindi verified.
- Not built, needs a decision (see roadmap): OCR and background removal need large libraries or models (tesseract.js language data, an ONNX segmentation model, 5–40 MB) — against the "no dependency without clear need" rule and the self-hosting choice. Excel/PowerPoint to PDF stay out (earlier decision: needs a server).
- Verified: typecheck, 299 tests, build. Browser run at 375 and 1280 px: 1:1 on a 4000×3000 photo → 3000×3000 at (500, 0), dragging a corner resizes, rotate swaps the bounds, a 1200×900 crop downloads at exactly 1200×900; Hindi + English caption and date stamp download at 4000×3000; no horizontal scroll, no errors.

### Everyday tools (roadmap phase 4, tools 18–23)
- **Date Calculator** (`/calculators/date-calculator`): days between dates (years/months/days, total, weeks, working days Mon–Fri and excluding Sundays, optional "count the end date"), or add/subtract days, weeks, months, years (31 Jan + 1 month = 28/29 Feb). UTC calendar maths, tested in two time zones.
- **Discount Calculator**: price after one or two stacked discounts (explains why 20% + 10% = 28%), or the discount % from MRP and price paid.
- **Gold Price Calculator**: user-entered 24K rate (per gram or 10 g; nothing fetched), 24/22/18/14K by fineness, making charges as % or ₹/g, 3% GST.
- **Unit Converter** (`/converters/unit-converter`): length, weight (incl. quintal, tola), area (sq ft, m², gaj, cent, guntha, acre, hectare; bigha left out as it varies by state), volume, speed, data (SI and binary), temperature; shows every unit at once and feet + inches for lengths.
- **Typing Speed Test** (`/text-tools/typing-test`): 1/3/5 minutes, three passages, net and raw WPM (5 chars = 1 word), accuracy, mistakes; per-character marking; paste disabled; speed shown after 3 s.
- **Character Counter** (`/text-tools/character-counter`, Word Counter widget with `mode: characters`): grapheme counts (emoji and Hindi conjuncts count once), room left for X, Instagram caption/bio, LinkedIn, YouTube title/description, Google title, meta description, and SMS parts (GSM 160/153 vs Unicode 70/67). The limits panel also appears on the Word Counter.
- Verified: typecheck, 318 tests (new `everyday.test.ts`), build. Browser run of all seven pages at 375 and 1280 px: correct defaults, gold total for ₹1,25,000/10 g 22K, typing scores, Hindi SMS → 3 Unicode parts, 100 gaj = 83.6127 m²; no horizontal scroll, no errors.

### UPI payment QR and rent receipts (backlog)
- **UPI QR Code Generator** (`/generators/upi-qr-code-generator`, QR widget preset `mode: upi`): UPI ID (validated as name@bank), payee name, optional amount (2 decimals) and note, encoded as NPCI's `upi://pay?pa=…&pn=…&am=…&cu=INR&tn=…`. The QR Code Generator gains the same "UPI payment" mode.
- **Rent Receipt Generator** (`/generators/rent-receipt-generator`): one receipt per month (current April–March year filled in, up to 24 months), amount in figures and Indian-style words (lakh, crore), landlord PAN (validated; warning when rent is over ₹1 lakh a year), payment mode, signature line, revenue stamp box for cash over ₹5,000; PDF built in the worker with pdf-lib, two receipts per A4 page with a cut line. Names must be in English letters (standard PDF font); the page says so.
- Verified: typecheck, 327 tests (UPI payload and rent receipt tests, incl. PDF page count), build. Browser run at 375 and 1280 px: the downloaded UPI PNG decodes (zxing) to the exact link; a 12-month PDF has 6 A4 pages whose text reads correctly; no horizontal scroll, no errors.
