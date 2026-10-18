# CLAUDE.md

All-in-one online tools website. Current phase: **frontend UI/UX only** — see `docs/ui-design-plan.md` for the full plan, phases, and decisions. Work one phase at a time and stop for approval between phases.

## Layout
- `frontend/` — React Router v8 **Framework Mode** (SSR), React 19, TypeScript strict, Tailwind CSS v4, Vite 8. Alias `~/*` → `frontend/app/*`.
- `backend/` — Laravel 12 skeleton. Do not touch during the UI phases.

## Commands (run in `frontend/`)
- `npm run dev` — dev server
- `npm run typecheck` — route typegen + `tsc` (must pass)
- `npm run build` — production build (must pass)
- `npm test` — Vitest engine + content tests (must pass)
No ESLint is configured.

## Conventions
- Routing/rendering changes: read `frontend/.agents/skills/react-router/` (Framework Mode reference) first.
- Colours, radii, shadows, spacing come from semantic tokens in `app/app.css` (bright neutral canvas, ink primary buttons, orange→pink brand gradient for highlights, coloured category tiles, rounded cards with soft shadows; Bricolage Grotesque + Geist + Geist Mono); no ad hoc hex values or one-off sizes in components.
- Reuse `app/components/ui` and `layout` primitives; tools are composed from `ToolLayout` + panels, never bespoke pages.
- Tool list: `app/data/tools.ts` (status live|soon). Working tools: definition in `app/tools/defs/`, registered in `app/tools/registry.ts`; processing runs client-side in the engine worker (`app/tools/engine/`). Published examples are tested against real engine output.
- Every route exports `meta` via the shared `buildMeta()` helper (title, description, canonical, OG).
- Semantic HTML, one `h1` per page, keyboard-accessible interactions, labelled icon buttons, state never shown by colour alone, respect `prefers-reduced-motion`.
- Icons: `lucide-react` only. No emoji as UI icons.
- Mock or demo behaviour must be labelled as such in the UI. No fake ratings, reviews, or usage stats.
- Do not add dependencies without a clear need; keep changes focused.
