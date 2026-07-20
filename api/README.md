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

### Auth (email OTP) — stateless

1. `auth.requestOtp` — `{ purpose: "login", email }` or `{ purpose: "signup", email, fullName, agreeToTerms }`
2. Email via **nodemailer** (SMTP_* env, or json transport + logs when SMTP empty)
3. `auth.verifyOtp` — `{ email, code, purpose }` → sets HttpOnly cookies (access + refresh)
4. Dev stub code: **`OTP_STUB_CODE=000000`** (empty → random 6-digit). **Forbidden in production.**

**Where state lives**

| Item | Store |
|------|--------|
| Access JWT | Client cookie — verified in-process (no DB) |
| Refresh token hash | **Redis** (TTL + revoke; any replica) |
| OTP challenge | **Redis** (TTL) |
| `users` / `oauth_accounts` | **Postgres** |

LinkedIn OAuth secrets: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` (routes still stub until wired).

Schema ER diagram: `npm run db:schema:mermaid` → `api/docs/schema.md`.

### Docker / K8s

```bash
docker build -f api/Dockerfile -t mockmatch-api .
```

Probes: `GET /health` (liveness), `GET /ready` (Postgres + Redis).  
Production stack: `infra/terraform/` (DOKS + GCP Secret Manager).

## Event-driven path

| Local | Production |
|-------|------------|
| Redis + BullMQ | DO managed Valkey + same BullMQ |
| Outbox table | Same pattern; relay task |
| Postgres Docker | DO managed Postgres (private VPC) |
| Worker process | DOKS `worker` Deployment |

Domain events live in `src/events/`. Publish via `EventBus`.
