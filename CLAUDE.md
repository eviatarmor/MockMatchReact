# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

MockMatch — interview prep app (resume scoring, AI mock interviews, readiness tracking). Currently a React frontend only (`client/`), early stage (login page + landing page scaffolded).

This is an npm workspaces monorepo. Root `package.json` has no deps of its own; all app code lives in `client/`.

## Testing UI changes

Don't start the dev server or open browser devtools yourself. Instead, ask the user to test the change and report back (e.g. what they see, any console errors).

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
- `@/features` — feature modules (route content, panels, hooks, types, constants)
- `@/components` — shared, cross-feature components (e.g. `@/components/icons`)
- `@/components/ui` — shadcn primitives (button, input, label, checkbox, separator, card)
- `@/lib` — utilities and cross-cutting setup (e.g. `@/lib/i18n`)
- `@/hooks` — shared cross-feature hooks
- `@/locales` — i18next translation resource files
- `@/lib/utils` — `cn()` helper etc.

### Routing
Routes are declared in `src/main.tsx` via `react-router-dom`'s `<Routes>`. Each route renders a page component from `src/pages/<name>-page.tsx`, which sets `document.title` and renders the feature's top-level content component from `features/<feature>/`.

### Feature module pattern
Features live under `src/features/<feature>/`:
- `<feature>-page.tsx` at the feature root — the content component rendered by `src/pages/<feature>-page.tsx`
- `types.ts` — shared domain types for the feature
- `constants.ts` — non-text structural data (ids, enums, ordering) — translatable copy lives in `@/locales`, not here
- `hooks/use-<feature>-*.ts` — extracted stateful logic
- Layout sub-folders (e.g. `left-pane/`, `right-pane/`) grouping the panels/components composed by `<feature>-page.tsx`
- Feature-specific icons that aren't shared go in `@/components/icons` if reused elsewhere, otherwise colocate in the feature folder

Example (login):
- Route: `src/pages/login-page.tsx` → renders `LoginPageContent`
- `features/login/login-page.tsx` composes `LoginHeroPanel` (left-pane) + `LoginFormPanel` (right-pane)
- `features/login/left-pane/` — `login-hero-panel.tsx`, `feature-highlight-list.tsx`, `readiness-summary-card.tsx`, `readiness-message-ticker.tsx`, `readiness-progress-bar.tsx`
- `features/login/right-pane/` — `login-form-panel.tsx`, `login-credentials-form.tsx`, `login-footer-links.tsx`, `login-password-field.tsx`, `social-auth-buttons.tsx`
- `features/login/types.ts` — `LoginCredentials`, `SocialProvider`, `FeatureHighlight`, `ReadinessSummary`
- `features/login/constants.ts` — `FEATURE_HIGHLIGHTS`, `READINESS_SUMMARY` (ids/scores/translation keys, no literal copy)
- `features/login/hooks/use-login-form.ts`, `use-social-auth.ts` — extracted stateful logic
- `@/components/icons/google-icon.tsx`, `linkedin-icon.tsx` — shared social icons

Follow this pattern for new features: structural constants in `features/<feature>/constants.ts`, shared types in `features/<feature>/types.ts`, translatable copy in `@/locales/<locale>/<feature>.json`, interactive state in dedicated hooks, presentational components composed in `features/<feature>/` (split into pane/layout sub-folders as the feature grows).

Exception: small self-contained UI animations (e.g. `ReadinessSummaryCard`'s rolling text/score) keep their `useState`/`useEffect` inline in the component instead of a dedicated hook — extract to a hook only if the logic is reused or grows complex.

### Internationalization (i18next)
- `@/lib/i18n` initializes `i18next` + `react-i18next`, imported once in `src/main.tsx`.
- Translation resources live in `@/locales/<locale>/<namespace>.json` (e.g. `en-US/common.json`, `en-US/login.json`). Namespace = feature name (or `common` for app-wide/shared copy like `appName`, hero headline).
- All user-facing copy must go through `useTranslation()` / `t()` — never hardcode strings in components. Structural data in `constants.ts` references translation keys (e.g. `labelKey: "featureHighlights.resume"`) rather than literal text.
- New locales/dialects (e.g. `en-GB`) are added as sibling folders under `@/locales` with the same namespace files, then registered in `@/lib/i18n`'s `resources`.

### Component conventions
- No semicolons in `.tsx`/`.ts` files within `features/`, `components/`, `hooks/`, `lib/` (existing code is unsemicoloned; `src/main.tsx` and other entry files still use semicolons — match the surrounding file).
- No backend/API wired up yet — form submissions are stubbed (e.g. `useLoginForm.handleSubmit` uses a dummy timeout).

### UI components — shadcnspace first
All new UI must come from **shadcnspace** (`mcp__shadcnspace-mcp__*` — `searchBlocks`/`listComponents` then `getBlockInstall`, installed via `npx shadcn@latest add @shadcn-space/<name>`) into `components/shadcn-space/<category>/`. Only fall back to plain **shadcn/ui** (`npx shadcn@latest add <component>` into `components/ui/`) when no shadcnspace equivalent exists. Do not hand-roll custom UI primitives (e.g. a bespoke `animated-text` component) when a shadcnspace/shadcn block covers it — `components/shadcn-space/animated-text/animated-text-04.tsx` (rolling text) is the pattern used by `ReadinessSummaryCard`.

## React skills

`client/.agents/skills/` contains Vercel-authored skill rule packs (composition patterns, React best-practices, view transitions). These encode the project's preferred React 19 patterns (e.g. no `forwardRef`, derived state without effects, memoization rules) — consult them when writing or reviewing component code.
