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
