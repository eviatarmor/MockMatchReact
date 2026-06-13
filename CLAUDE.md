# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

MockMatch — interview prep app (resume scoring, AI mock interviews, readiness tracking). Currently a Next.js frontend only (`client/`), early stage (login page + landing page scaffolded).

This is an npm workspaces monorepo. Root `package.json` has no deps of its own; all app code lives in `client/`.

## ⚠️ Non-standard Next.js version

`client` uses **Next.js 16.2.9** — breaking changes vs. older Next.js you may know from training data. Before writing Next.js-specific code (routing, config, data fetching, server/client components, metadata, etc.), read the relevant guide in `client/node_modules/next/dist/docs/01-app/` first. Heed deprecation notices.

## Commands

Run from repo root:
```bash
npm run dev          # starts client dev server via workspaces
```

Run from `client/`:
```bash
npm run dev          # next dev
npm run build        # next build
npm run start        # next start
npm run lint         # eslint
```

No test runner is configured yet.

## Architecture

### Stack
- Next.js 16 (App Router), React 19, TypeScript (strict)
- Tailwind CSS v4 (`@tailwindcss/postcss`, `app/globals.css`)
- shadcn/ui (`style: base-nova`, neutral base color, lucide icons) — config in `client/components.json`
- ESLint: `eslint-config-next` (core-web-vitals + typescript) + `eslint-plugin-sonarjs`

### Path aliases (`@/*` → `client/*`)
- `@/components` — shared/feature components
- `@/components/ui` — shadcn primitives (button, input, label, checkbox, separator, card)
- `@/lib` — utilities and domain logic
- `@/hooks` — custom hooks
- `@/lib/utils` — `cn()` helper etc.

### Feature module pattern
Features are organized as: route in `app/<feature>/page.tsx` → top-level component in `components/<feature>/` → sub-panels/icons in `components/<feature>/` (and `components/<feature>/icons/`) → domain types/constants in `lib/<feature>/types.ts` and `lib/<feature>/constants.ts` → stateful logic extracted into `hooks/use-<feature>-*.ts`.

Example (auth/login):
- Route: `app/login/page.tsx` → renders `LoginPage`
- `components/auth/login-page.tsx` composes `LoginHeroPanel` + `LoginFormPanel`
- `components/auth/login-credentials-form.tsx`, `social-auth-buttons.tsx`, `feature-highlight-list.tsx`, `readiness-summary-card.tsx` — sub-components
- `lib/auth/types.ts` — `LoginCredentials`, `SocialProvider`, `FeatureHighlight`, `ReadinessSummary`
- `lib/auth/constants.ts` — copy/content constants (`LOGIN_COPY`, `FEATURE_HIGHLIGHTS`, etc.)
- `hooks/use-login-form.ts`, `use-social-auth.ts` — extracted stateful logic

Follow this pattern for new features: copy/content as constants in `lib/<feature>/constants.ts`, shared types in `lib/<feature>/types.ts`, interactive state in dedicated hooks, presentational components composed in `components/<feature>/`.

Exception: small self-contained UI animations (e.g. `ReadinessSummaryCard`'s rolling text/score) keep their `useState`/`useEffect` inline in the component instead of a dedicated hook — extract to a hook only if the logic is reused or grows complex.

### Component conventions
- No semicolons in `.tsx`/`.ts` files within `components/`, `hooks/`, `lib/` (existing code is unsemicoloned; app/ root files still use semicolons — match the surrounding file).
- Client components marked with `"use client"` at top (hooks and interactive components).
- No backend/API wired up yet — form submissions are stubbed (e.g. `useLoginForm.handleSubmit` uses a dummy timeout).

### UI components — shadcnspace first
All new UI must come from **shadcnspace** (`mcp__shadcnspace-mcp__*` — `searchBlocks`/`listComponents` then `getBlockInstall`, installed via `npx shadcn@latest add @shadcn-space/<name>`) into `components/shadcn-space/<category>/`. Only fall back to plain **shadcn/ui** (`npx shadcn@latest add <component>` into `components/ui/`) when no shadcnspace equivalent exists. Do not hand-roll custom UI primitives (e.g. a bespoke `animated-text` component) when a shadcnspace/shadcn block covers it — `components/shadcn-space/animated-text/animated-text-04.tsx` (rolling text) is the pattern used by `ReadinessSummaryCard`.

## React/Next.js skills

`client/.agents/skills/` contains Vercel-authored skill rule packs (composition patterns, React best-practices, view transitions). These encode the project's preferred React 19/Next.js patterns (e.g. no `forwardRef`, derived state without effects, memoization rules) — consult them when writing or reviewing component code.
