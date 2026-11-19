# SEO strategy: from impressions to clicks

Written 19 Nov 2026 from Google Search Console data for `https://alltoolsdesk.com/` (last 3 months, data from 19 Oct).

## 1. Diagnosis

| Metric | Value |
| --- | --- |
| Clicks | 2 |
| Impressions | 2,260 |
| Average CTR | 0.1% |
| Average position | 59.7 |
| Indexed pages | 100 (71 not indexed) |

**The low CTR is a ranking problem, not a snippet problem.** Most impressions come from positions 55–90 (pages 6–9 of Google), where almost nobody scrolls. The pages that rank in the top 10 already convert well: Add Text to Photo (position 8.1, 6.7% CTR), the home page (3.6, 12.5%), Merge PDF (9.3, 33%). Better titles alone will not fix a position of 60; the pages need to match search intent better than the pages above them.

**Where the impressions are**

| Topic | Impressions | Position | What searchers want |
| --- | --- | --- | --- |
| BMI (166 queries) | 947 | 75–90 | "bmi calculator in kg and cm", "in kg and feet", "5.6 feet bmi weight in kg", "bmi chart kg and feet" |
| JavaScript formatter | ~80 | 54–64 | "javascript formatter", "js formatter", "formatter js", "javascript prettify" |
| Car / personal loan EMI | ~110 | 62–92 | "how to calculate car loan emi manually", "how to calculate personal loan emi" |
| Resize image | ~45 | 64–76 | "resize image pixels", "change size of image in pixels" |
| SQL formatter | ~30 | 63–84 | "postgresql beautifier", "sql query beautifier", "mysql formatter" |
| Passport / ID photo | ~25 | 74–92 | "passport photo crop", "id photo crop" |

The BMI audience is mostly Indian: they weigh in kilograms but know their height in feet. The calculator only offered kg + cm or lb + ft, and used only WHO ranges, while Indian guidelines use the lower Asian cut-offs.

**Indexing report (Page indexing, last update 13 Nov)**

| Reason | Pages | Verdict |
| --- | --- | --- |
| Page with redirect | 46 | Expected. These are old `/<path>/` URLs that now 301 to the canonical `/<path>` (fix of 31 Oct). Google keeps listing them until it drops them; "Validation failed" only means they still redirect, which is correct. No action. |
| Alternate page with proper canonical | 17 | Expected: slash variants and `/tools?category=…` filter URLs pointing at their canonical. No action. |
| Not found (404) | 3 | `/$`, `/&` (strings inside React's inline hydration script) and `/docs` (an example inside the HTML Formatter sample). Not real links; 404 is the correct answer. No action. |
| Soft 404 | 2 | `/pdf-tools/add-page-numbers` (crawled before it went live; now 897 words of content) and `/pdf-tools/compress-pdf-to-1mb` (deliberately `noindex`). Request indexing for the first. |
| Discovered – currently not indexed | 3 | Delete PDF Pages, Protect PDF, Unlock PDF: few internal links. Fixed below. |

Crawl stats: host healthy for 90 days, 83% 200 responses, no server errors. No manual actions, no security issues.

**Two warnings**

- The Performance report shows **zero impressions from 11 Nov onwards** after ~150–180 a day. The site is still indexed, crawling is healthy and Search Console's own recommendations say the BMI page's impressions are rising, so this looks like a reporting gap. Re-check the Performance report on 22–23 Nov. If it is still zero, check URL Inspection → Test live URL on the home page.
- **McAfee WebAdvisor blocks alltoolsdesk.com** in the owner's Chrome. The most likely trigger is the Monetag code added on 14 Nov (vignette `n6wxm.com`, push `nap5k.com`, service worker `/sw.js` importing from `5gvci.com`). Visitors with McAfee, Norton or similar see a warning page instead of the site, and full-screen vignettes count as intrusive interstitials for Google on mobile. The owner chose to keep Monetag for now; if traffic does not recover, this is the first thing to revisit. Check the site's rating at <https://www.siteadvisor.com/> and request a review there.

## 2. Changes in this release

1. **BMI calculator rebuilt around how people search**
   - Units: kg + cm, **kg + feet/inches** (new), lb + feet/inches.
   - Ranges: WHO (18.5 / 25 / 30) or **Asian** (WHO Asia-Pacific, used by India's guidelines: 18.5 / 23 / 25).
   - Shows the height in both cm and ft/in; explains that 5.8 ft is 5 ft 9.6 in, not 5 ft 8 in.
   - New **BMI chart** on the page: healthy weight in kg for every height from 4 ft 10 in to 6 ft 4 in, both scales, generated from the engine and tested.
   - New title "BMI Calculator in kg and cm or Feet – WHO & Asian Ranges", description, overview, how-to, examples and FAQ (kg/cm and kg/feet by hand, healthy weight for 5 ft 6 in, why the Asian ranges are lower). Added to the home page's popular tools.
2. **Car, personal and home loan pages**: each FAQ now opens with "How do I calculate … EMI manually?", working the formula step by step for the page's example loan (every number checked against the calculator in tests) plus the Excel `PMT` formula. The three loan pages now link to each other.
3. **Titles matched to real queries**: JavaScript Formatter & JS Beautifier, SQL Formatter (MySQL & PostgreSQL), Resize Image in Pixels, Passport Photo Crop, UUID Generator (unique IDs). The JS formatter FAQ explains that formatter, beautifier and prettifier are the same thing.
4. **Internal links for the PDF cluster**: Merge, Split, Rotate, JPG to PDF, Compress and PDF to Word now link to Delete Pages, Add Page Numbers, Protect, Unlock and Organize, instead of to unrelated image tools.
5. Tool pages can carry a reference table (`reference` in the tool definition), rendered as a proper HTML table with row headers.

## 3. After deploying (owner checklist)

1. Deploy (`cd frontend && npm run deploy`). IndexNow notifies Bing and Yandex automatically.
2. In Search Console → URL Inspection, **Request indexing** for:
   - `https://alltoolsdesk.com/calculators/bmi-calculator`
   - `https://alltoolsdesk.com/calculators/car-loan-emi-calculator`
   - `https://alltoolsdesk.com/calculators/personal-loan-emi-calculator`
   - `https://alltoolsdesk.com/developer-tools/js-formatter`
   - `https://alltoolsdesk.com/pdf-tools/add-page-numbers`
   - `https://alltoolsdesk.com/pdf-tools/delete-pdf-pages`
3. Sitemaps → resubmit `/sitemap.xml`.
4. Do **not** click "Validate fix" on "Page with redirect" again: those URLs are meant to redirect.
5. Re-check Performance on 22–23 Nov (see the reporting-gap warning above).

## 4. The next 90 days

A new site with no backlinks ranks on page 6 for head terms like "bmi calculator". The way up is depth on long-tail queries and a few real links.

**Weeks 1–2**
- Watch the BMI page: target position under 30 for "bmi calculator in kg and feet" and "bmi chart kg and feet".
- Apply the same "how do I calculate it manually" FAQ pattern to the SIP, FD, PPF, GST and income tax calculators.

**Weeks 3–6: guides that answer the long tail and link to the tools**
- "Ideal weight for height in kg and feet (chart for Indian men and women)" → BMI calculator.
- "How to calculate EMI manually, with Excel formula" → loan pages.
- "How to resize an image to exact pixels for online forms" → Resize Image, Exam Photo Resizer.
- One guide a week; each must contain worked numbers from the site's own engines, as the existing guides do.

**Weeks 4–12: authority**
- Get listed where Indian students and job seekers look for form-photo tools: college and coaching forums, Quora answers to "how to resize photo for SSC/IBPS form", Reddit r/developersIndia for the developer tools. One genuine, helpful answer with a link beats many low-quality backlinks.
- Submit the developer tools to free-tool directories (e.g. AlternativeTo, Product Hunt as a tools collection).
- Do not buy links or use link exchanges: Google can demote the whole site for that.

**Measure every two weeks** in Search Console → Performance → Pages: impressions, position and CTR for the six pages above. A page that reaches positions 8–15 with CTR under 2% is the moment to rewrite its title and description; before that, work on content and links.

## 5. AdSense readiness (19 Nov 2026)

Done:
- Category pages now carry real content (345–601 words each) and link every indexable landing page.
- 15 guides (5 added), each with worked figures from the site's engines.
- Feet to CM height converter for "5.8 feet in cm" searches (the Unit Converter ranked 9.3 for one).
- PAN resizer names NSDL (Protean) and UTIITSL; JS Minifier title matches "compress JS".

Known risk, owner's decision to keep: Monetag vignette and push-notification tags plus `/sw.js`. McAfee WebAdvisor blocks the site, and AdSense policy holds the publisher responsible for other networks' behaviour on pages with AdSense code. If the next review is rejected for "site behaviour" or "policy violations", remove Monetag first.

Before reapplying: deploy, request indexing for the new pages, wait about two weeks for a recrawl, then request review in AdSense.
