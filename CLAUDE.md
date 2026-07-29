# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication style

Always use **caveman ultra** for chat replies (`/caveman ultra` / skill `user:caveman` at intensity `ultra`):

- Terse fragments. Drop articles, filler, hedging, pleasantries.
- Abbreviate prose (DB/auth/config/req/res/fn/impl). Arrows for causality (`X → Y`).
- Technical terms, code, identifiers, error strings: exact — never abbreviate those.
- Pattern: `[thing] [action] [reason]. [next step].`
- Code, commits, PRs: write normal English.
- Drop caveman only for security warnings, irreversible confirmations, multi-step sequences where compression risks misread, or when user asks to clarify.
- Off only if user says `stop caveman` / `normal mode`.

## Ask assistant product guide

In-app **Ask** chat (navbar) uses a free OpenRouter model and a product system prompt.

- **Runtime guide (source of truth):** `api/src/modules/ask/product-guide.ts`
- **System prompt builder:** `api/src/modules/ask/system-prompt.ts`
- **Stream route:** `POST /ask/chat` (`api/src/modules/ask/routes.ts`)
- **Client UI:** `client/src/features/ask/` (shell); shared chat: `@mockmatch/ai-chat`

**When adding or changing user-facing features, routes, or nav items, update `product-guide.ts`** so the assistant stays accurate (page map + how-tos). Do not put the full prompt only in this file — keep the guide co-located with the API module.

## Project overview

MockMatch — interview prep app (resume scoring, AI mock interviews, readiness tracking). Monorepo: React client + Hono/tRPC API scaffold + Docker infra.

Workspaces: `client/`, `api/`, `packages/*` (`schemas`, `ui`, `ai-chat`, `ide`, `document-editor`, `collab`, `document-assistant`). Local infra: `infra/` (Postgres+pgvector+pgaudit, Redis). Production hosting: TBD (DigitalOcean / Terraform removed).

### Shared packages

| Package | Path | Role |
|---------|------|------|
| `@mockmatch/schemas` | `packages/schemas` | Shared Zod DTOs (API + client) |
| `@mockmatch/ui` | `packages/ui` | Shared UI kits: `src/shadcn/`, `src/shadcn-space/`, `src/kibo-ui/` + `cn()` — web + future extensions |
| `@mockmatch/ai-chat` | `packages/ai-chat` | Product-agnostic chat shell (hooks + message UI); host supplies transport/labels. Later OSS extract. |
| `@mockmatch/ide` | `packages/ide` | IDE shell: optional file tree, resizable split, Monaco, tabs, settings bar. Host supplies tree/tabs/session. |
| `@mockmatch/document-editor` | `packages/document-editor` | Block/rich-text editor shell + Harper grammar. Host supplies dialect, labels, save. |
| `@mockmatch/collab` | `packages/collab` | Collab room hook (inject ticket), presence/cursors, path-ops. Share admin UI stays in host. |
| `@mockmatch/document-assistant` | `packages/document-assistant` | Document AI rail on top of ai-chat (replace tool, attachments). |

Imports: `@mockmatch/ui/button`, `@mockmatch/ai-chat`, `@mockmatch/ai-chat/ai-elements/speech-input`, `@mockmatch/ide`, `@mockmatch/document-editor`, `@mockmatch/collab`, `@mockmatch/document-assistant`. Theme CSS tokens stay in the host (`client/src/index.css`); Tailwind must `@source` package `src/**` (paths relative to `client/src`: `../../packages/<name>/src/**/*.{ts,tsx}`).

### Where new shared code goes

| Kind | Destination | Rule |
|------|-------------|------|
| **UI library / primitives** | `packages/ui` | **Always.** Folder by registry: shadcn/magic-ui → `packages/ui/src/shadcn/`; shadcnspace → `packages/ui/src/shadcn-space/<category>/`; kibo-ui → `packages/ui/src/kibo-ui/`. Never install into `client/src/components/`. Imports: `@mockmatch/ui/<name>` or `@mockmatch/ui/shadcn/<name>` (shadcn), `@mockmatch/ui/shadcn-space/...`, `@mockmatch/ui/kibo-ui/...`. After add: relative imports; Tailwind `@source` covers `packages/ui/src/**`. |
| **Reusable product-agnostic shells** (chat, etc.) | `packages/*` | Extract when host-agnostic (web + extensions). See `@mockmatch/ai-chat`. |
| **Heavy surface engines** (IDE-like editor, whiteboard/canvas, spreadsheet/Excel-like grid, code playground, diagram tool, etc.) | `packages/*` (new package) | **Do not invent package layout alone.** If building or extracting something in this class, **stop and ask the user** (name, scope, peers, stay monorepo vs OSS later). Then scaffold under `packages/` only after confirmation. |
| **App-only feature UI** | `client/src/features/` or `client/src/components/` | MockMatch-specific chrome, pages, dashboard, product adapters. |

**Do not** drop a new shared UI kit into `client/` “for now.” Extensions reuse `packages/ui` (+ other packages). When unsure whether something is a package → **ask**.

## Project memory (durable decisions)

Detailed memories live in **`.claude/rules/`** (and mirror **`.grok/rules/`**). Auto-loaded as project rules. Read before auth/infra work:

| File | Topic |
|------|--------|
| `domain-auth-concepts.md` | JWT, refresh, OTP, oauth_accounts, outbox, Redis vs Postgres |
| `stateless-api-contract.md` | Multi-replica hard rules, probes, prod env guards |
| `infra-production.md` | Local vs prod status (prod TBD; DO removed) |
| `ops-checklist.md` | Local boot steps |

### Auth state placement (do not reverse)

- **Access JWT** — client only; verify in-process (stateless hot path)
- **Refresh token hash + OTP** — **Redis** (`api/src/lib/auth-store.ts`); enables any API replica
- **users / oauth_accounts** — **Postgres**; oauth rows created at runtime only (never seed via IaC)
- Tables `otp_challenges` / `refresh_tokens` **removed** (migration `0001`)

### Stateless multi-replica intent

API must stay **process-stateless** for horizontal scaling and future WebSocket autoscaling. Shared state only in Redis/Postgres/object storage. No sticky sessions for REST. Future `ws` service uses Redis pub/sub adapter.

### Schema diagram

```bash
npm run db:schema:mermaid   # → api/docs/schema.md
```

## Testing UI changes

Don't start the dev server or open browser devtools yourself. Instead, ask the user to test the change and report back (e.g. what they see, any console errors).

## Commands

Run from repo root:
```bash
npm run dev          # sandbox (gVisor) + client + api + ws + worker + Drizzle Studio
npm run dev:client   # vite only
npm run dev:api      # Hono + tRPC API
npm run dev:ws       # collab WebSocket
npm run dev:worker   # BullMQ workers (also started by npm run dev)
npm run dev:studio   # drizzle-kit studio only
npm run infra:up     # Postgres + Redis (local)
npm run infra:down
npm run db:schema:mermaid  # regenerate ER diagram from Drizzle
```

Run from `client/`:
```bash
npm run dev          # vite dev server
npm run build        # tsc -b && vite build
npm run preview      # preview production build
npm run lint         # eslint
```

Run from `api/`:
```bash
npm run dev          # tsx watch HTTP server
npm run dev:worker   # tsx watch workers
npm run db:generate  # drizzle-kit generate
npm run db:migrate
npm run db:studio
npm run db:schema:mermaid
```

Docker API image (repo root): `docker build -f api/Dockerfile -t mockmatch-api .`

Local ops: see `infra/README.md` and `.claude/rules/ops-checklist.md`. No production provider stack in-repo.

No test runner is configured yet.

## Architecture

### Stack
**Client**
- Vite + React 19, TypeScript (strict)
- react-router-dom, TanStack Query, tRPC client (`@/lib/trpc`)
- Tailwind CSS v4 (`@tailwindcss/postcss`, `src/index.css`)
- shadcn/ui (`style: base-nova`, neutral base color, lucide icons) — config in `client/components.json`
- ESLint: `@eslint/js` + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` + `eslint-plugin-sonarjs`

**API** (`api/`)
- Hono + tRPC (`/trpc/*`); `GET /health` (liveness), `GET /ready` (Postgres+Redis)
- Drizzle ORM + PostgreSQL; BullMQ + Redis (queues + OTP + refresh hashes)
- jose (JWT access 15m / refresh 30d); OpenRouter SDK, AWS S3 SDK (stubs)
- Shared Zod DTOs: `@mockmatch/schemas`; UI primitives: `@mockmatch/ui`; AI chat shell: `@mockmatch/ai-chat`
- LinkedIn OAuth env slots; handlers may still be stubs

**Infra** (`infra/`)
- Local only: docker-compose postgres (pgvector + pgaudit) + redis
- Production: TBD (DigitalOcean / Terraform removed)

### Path aliases (`@/*` → `client/src/*`)
- `@/features` — feature modules (route content, panels, hooks, types, constants)
- `@/components` — shared, cross-feature components (e.g. `@/components/icons`)
- `@mockmatch/ui` — UI kits in `packages/ui` (`src/shadcn/`, `shadcn-space/`, `kibo-ui/`)
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
- API scaffold exists (`api/`) with tRPC stubs; client forms still use dummy timeouts until auth is wired to `trpc.auth.*`.

### UI components — shadcnspace first
All new UI must come from **shadcnspace** (`mcp__shadcnspace-mcp__*` — `searchBlocks`/`listComponents` then `getBlockInstall`, installed via `npx shadcn@latest add @shadcn-space/<name>`), or other registries (kibo-ui, magic-ui) when needed. **All registry UI goes in `packages/ui/src/` by kit folder** — shadcn/magic-ui → `shadcn/`, shadcnspace → `shadcn-space/<category>/`, kibo-ui → `kibo-ui/`. Import `@mockmatch/ui/...` (shadcn short paths stay `@mockmatch/ui/button`). Never install into `client/src/components/`. Only fall back to plain **shadcn/ui** when no shadcnspace equivalent exists. Do not hand-roll custom UI primitives when a registry block covers it.

### List / grid entrance — `StaggerItem` + table body stagger
Shared fast cascade for lists and horizontal strips. **Do not re-implement** per-feature `motion` delays.

- **Cards / lists / strips:** `@mockmatch/ui/stagger` (`StaggerItem`, `STAGGER`, `staggerDelay`, `staggerTransition`)
- **Tables:** cascade is built into `EntityTable` via `tbody.entity-table-body` CSS (see `client/src/index.css`). Values match `STAGGER` (first 12 rows). Row components render plain `<tr>` — **do not** wrap table rows in `StaggerItem`. Custom tables that are not `EntityTable` should put `entity-table-body` on their `<tbody>`.
- **Stack:** `motion` (already a client dep). First `STAGGER.count` (12) items delay by `index * STAGGER.delay` (0.04s); later indices mount with delay `0`.
- **API (non-table):** `index` required; `as` = `"div"` | `"li"` (default `"div"`); `direction` = `"up"` | `"down"` | `"left"` | `"right"` (default `"up"`).

```tsx
import { StaggerItem } from "@mockmatch/ui/stagger"
import { EntityTable } from "@/components/data/entity-table"

// Vertical list / card grid
{items.map((item, i) => (
  <StaggerItem key={item.id} index={i}>{/* card */}</StaggerItem>
))}
// Table — stagger is automatic; rows are plain <tr>
<EntityTable columns={columns} isEmpty={false} emptyMessage="">
  {items.map((item) => (
    <tr key={item.id} className="...">...</tr>
  ))}
</EntityTable>
// Horizontal template / card strip
<StaggerItem index={i} direction="left">...</StaggerItem>
```

**Already wired**
| Surface | Notes |
|---------|--------|
| All `EntityTable` surfaces | Auto row cascade via `.entity-table-body` |
| Discover job list | `StaggerItem` `up` |
| Template strip + full template browse | `StaggerItem` `left` |
| Applications kanban | `StaggerItem` on cards (not while dragging) |

**Do not use for:** Magic UI `progressive-blur` on page-scroll lists (bleeds borders / sticky hacks) — only if content lives in a **fixed-height clipped scroller**. Magic UI `AnimatedList` is for landing-page notification demos (reverses order) — not product data lists.

## React skills

`client/.agents/skills/` contains Vercel-authored skill rule packs (composition patterns, React best-practices, view transitions). These encode the project's preferred React 19 patterns (e.g. no `forwardRef`, derived state without effects, memoization rules) — consult them when writing or reviewing component code.
