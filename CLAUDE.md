# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

MockMatch — interview prep app (resume scoring, AI mock interviews, readiness tracking). Currently a React frontend only (`client/`), early stage (login page + landing page scaffolded).

This is an npm workspaces monorepo. Root `package.json` has no deps of its own; all app code lives in `client/`.

## Commands

Run from repo root:
```bash
npm run dev          # starts client dev server via workspaces
```

Run from `client/`:
```bash
npm run dev          # vite dev server
npm run build        # tsc -b && vite build
npm run preview      # preview production build
npm run lint         # eslint
```

No test runner is configured yet.

## Architecture

### Stack
- Vite + React 19, TypeScript (strict)
- react-router-dom for client-side routing
- Tailwind CSS v4 (`@tailwindcss/postcss`, `src/index.css`)
- shadcn/ui (`style: base-nova`, neutral base color, lucide icons) — config in `client/components.json`
- ESLint: `@eslint/js` + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` + `eslint-plugin-sonarjs`

### Path aliases (`@/*` → `client/src/*`)
- `@/components` — shared/feature components
- `@/components/ui` — shadcn primitives (button, input, label, checkbox, separator, card)
- `@/lib` — utilities and domain logic
- `@/hooks` — custom hooks
- `@/lib/utils` — `cn()` helper etc.

### Routing
Routes are declared in `src/main.tsx` via `react-router-dom`'s `<Routes>`. Each route renders a page component from `src/pages/<name>-page.tsx`, which sets `document.title` and renders the feature's top-level component from `components/<feature>/`.

### Feature module pattern
Features are organized as: route in `src/pages/<feature>-page.tsx` → top-level component in `components/<feature>/` → sub-panels/icons in `components/<feature>/` (and `components/<feature>/icons/`) → domain types/constants in `lib/<feature>/types.ts` and `lib/<feature>/constants.ts` → stateful logic extracted into `hooks/use-<feature>-*.ts`.

Example (auth/login):
- Route: `src/pages/login-page.tsx` → renders `LoginPage`
- `components/auth/login-page.tsx` composes `LoginHeroPanel` + `LoginFormPanel`
- `components/auth/login-credentials-form.tsx`, `social-auth-buttons.tsx`, `feature-highlight-list.tsx`, `readiness-summary-card.tsx` — sub-components
- `lib/auth/types.ts` — `LoginCredentials`, `SocialProvider`, `FeatureHighlight`, `ReadinessSummary`
- `lib/auth/constants.ts` — copy/content constants (`LOGIN_COPY`, `FEATURE_HIGHLIGHTS`, etc.)
- `hooks/use-login-form.ts`, `use-social-auth.ts` — extracted stateful logic

Follow this pattern for new features: copy/content as constants in `lib/<feature>/constants.ts`, shared types in `lib/<feature>/types.ts`, interactive state in dedicated hooks, presentational components composed in `components/<feature>/`.

Exception: small self-contained UI animations (e.g. `ReadinessSummaryCard`'s rolling text/score) keep their `useState`/`useEffect` inline in the component instead of a dedicated hook — extract to a hook only if the logic is reused or grows complex.

### Component conventions
- No semicolons in `.tsx`/`.ts` files within `components/`, `hooks/`, `lib/` (existing code is unsemicoloned; `src/main.tsx` and other entry files still use semicolons — match the surrounding file).
- No backend/API wired up yet — form submissions are stubbed (e.g. `useLoginForm.handleSubmit` uses a dummy timeout).

### UI components — shadcnspace first
All new UI must come from **shadcnspace** (`mcp__shadcnspace-mcp__*` — `searchBlocks`/`listComponents` then `getBlockInstall`, installed via `npx shadcn@latest add @shadcn-space/<name>`) into `components/shadcn-space/<category>/`. Only fall back to plain **shadcn/ui** (`npx shadcn@latest add <component>` into `components/ui/`) when no shadcnspace equivalent exists. Do not hand-roll custom UI primitives (e.g. a bespoke `animated-text` component) when a shadcnspace/shadcn block covers it — `components/shadcn-space/animated-text/animated-text-04.tsx` (rolling text) is the pattern used by `ReadinessSummaryCard`.

## React skills

`client/.agents/skills/` contains Vercel-authored skill rule packs (composition patterns, React best-practices, view transitions). These encode the project's preferred React 19 patterns (e.g. no `forwardRef`, derived state without effects, memoization rules) — consult them when writing or reviewing component code.
