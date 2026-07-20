# @mockmatch/api

Hono + tRPC API for MockMatch. Scaffold only — auth, search, and AI procedures are stubs.

## Stack

- **Hono** — HTTP (`/health`, OAuth redirects)
- **tRPC** — typed RPC at `/trpc/*` (client imports `AppRouter`)
- **Drizzle ORM** + PostgreSQL (pgvector / pgaudit via `infra/`)
- **BullMQ** + Redis — local event bus (swap for SQS/EventBridge later)
- **jose** — JWT helpers
- **OpenRouter SDK**, **AWS S3 SDK** — client stubs

## Commands

From repo root (with workspaces) or `api/`:

```bash
npm run dev --workspace=@mockmatch/api        # HTTP server
npm run dev:worker --workspace=@mockmatch/api # BullMQ workers
npm run db:generate --workspace=@mockmatch/api
npm run db:migrate --workspace=@mockmatch/api
npm run db:studio --workspace=@mockmatch/api
```

Copy `.env.example` → `.env` (requires Postgres + Redis from `infra/`).

## tRPC

- Router export: `@mockmatch/api/router` → `AppRouter` type
- Client: `client/src/lib/trpc` via `@trpc/react-query`
- Procedures: `auth.requestOtp`, `auth.verifyOtp`, `auth.refresh`, `auth.logout`, `auth.me`, `questions.list` (stub)

### Auth (email OTP)

1. `auth.requestOtp` — `{ purpose: "login", email }` or `{ purpose: "signup", email, fullName, agreeToTerms }`
2. Email via **nodemailer** (SMTP_* env, or json transport + logs when SMTP empty)
3. `auth.verifyOtp` — `{ email, code, purpose }` → JWT access + refresh + user
4. Dev stub code: **`OTP_STUB_CODE=000000`** (empty → random 6-digit)

Tokens stored client-side in `localStorage` (`mockmatch.auth`).

## Event-driven path → AWS

| Local | Later |
|-------|--------|
| Redis + BullMQ | SQS (+ DLQ) / EventBridge |
| Outbox table | Same pattern; relay task |
| Postgres Docker | RDS + pgvector |
| Worker process | Separate ECS service |

Domain events live in `src/events/`. Publish via `EventBus`; never dual-write without outbox for critical side effects.
