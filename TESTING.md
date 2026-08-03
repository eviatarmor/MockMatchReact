# Testing

## Layout

```
api/
  src/                         # production
  tests/
    setup/ helpers/ unit/ integration/

client/
  src/
  tests/
    setup/ unit/
    e2e/                       # Playwright
      helpers/
      smoke | public | auth | dashboard
      resume-lab | collab-ws

packages/<name>/
  src/                         # production only
  tests/
    setup/                     # optional (jsdom)
    unit/                      # mirrors former src paths
```

Voice: `voice/tests/` (Python unittest).

## Stack

| Layer | Tool |
|-------|------|
| Unit | Vitest (`tests/unit`) |
| API integration | Vitest + Testcontainers (`api/tests/integration`) |
| Browser E2E | Playwright (`client/tests/e2e`) |
| Packages | Vitest (`packages/*/tests/unit`) |
| **Benchmarks** | Vitest `bench` / Tinybench (`tests/bench/**/*.bench.ts`) |

## Benchmarks (hot paths only)

Micro-benches for code on collab / lists / validation paths — **not** full HTTP load tests.

| Workspace | File(s) | What |
|-----------|---------|------|
| `@mockmatch/api` | `path-op`, `crypto`, `embeddings` | LWW set/get, SHA-256 OTP, cosine 1536-d |
| `client` | `pure-lib` | relative time, score bands, datetime |
| `@mockmatch/schemas` | `parse` | Zod resume / OTP / job search |
| `@mockmatch/collab` | `path-op`, `json-y` | LWW + Yjs bridge |
| `@mockmatch/whiteboard` | `geometry` | hit-test, RDP simplify |
| `@mockmatch/document-assistant` | `replace` | find/replace, stripHtml |
| `@mockmatch/ui` | `cn` | class merge (every render) |

```bash
npm run test:bench                                    # all of the above
npm run test:bench --workspace=@mockmatch/api         # one workspace
```

Layout: `tests/bench/*.bench.ts` + `vitest.bench.config.ts` per workspace.  
Vitest marks `bench` as experimental — pin Vitest if you compare numbers across upgrades.

### DB / Redis / in-process HTTP benches (Docker)

Yes — local Postgres+Redis **can** and **do** get benched, same harness as integration tests:

```bash
# Testcontainers (needs Docker socket access), or:
USE_EXISTING_INFRA=1 npm run test:bench:db
# with: npm run infra:up + migrated DATABASE_URL/REDIS_URL
```

| File | Measures |
|------|----------|
| `api/tests/bench/db/resumes.bench.ts` | list/get/create+delete via tRPC caller + real SQL |
| `api/tests/bench/db/redis-auth.bench.ts` | OTP + refresh hash Redis ops |
| `api/tests/bench/db/http-trpc.bench.ts` | in-process Hono `/health`, `/ready`, tRPC list/get |

**Still not k6 multi-client RPS** — single-process Tinybench loops. Good for “did this query get 10× slower?”; not for capacity planning.

**Still not EXPLAIN ANALYZE automation** — optional follow-up (log plans once per seed). For index work, run `EXPLAIN` in Studio against the same Docker DB.

**Still not OpenRouter/Stripe** — third-party; mock or rare smoke only.

**Still not Playwright wall-clock** — browser variance; use Web Vitals / dedicated perf job if needed.

## Playwright E2E

| Spec | Coverage |
|------|----------|
| `smoke.spec.ts` | Login/signup render, unauth gate |
| `public.spec.ts` | Home, links, 404 |
| `auth.spec.ts` | API + UI OTP signup/login |
| `dashboard.spec.ts` | Authenticated route matrix |
| **`resume-lab.spec.ts`** | **Create → editor → list** (API + UI New resume) |
| **`collab-ws.spec.ts`** | **WS ticket + snapshot**; guest share join |

### Run E2E

```bash
# terminal 1
npm run infra:up
npm run dev          # client + api + ws + worker

# terminal 2
npx playwright install chromium   # once
npm run test:e2e
```

| Env | Default |
|-----|---------|
| `E2E_BASE_URL` | `http://localhost:5173` |
| `E2E_API_URL` | `http://localhost:3000` |
| `E2E_WS_URL` | `ws://localhost:3001` |
| `E2E_OTP_CODE` | `000000` |
| `E2E_SKIP` | set `1` to skip all |

Auth/resume/collab skip if API `/health` fails. Collab WS tests skip if `dev:ws` is down.

## API integration

```bash
npm run test:integration
# or: USE_EXISTING_INFRA=1 npm run test:integration
```

14 modules: auth, health, resumes, cover-letters, account, billing, questions, tracked-jobs, practice-*, ide-workspaces, collab, whiteboard, document-versions.

## Unit

```bash
npm run test:unit    # api + client + all packages
```

Package imports in tests use `@/` → package `src/`.

## Commands

```bash
npm run test              # → test:unit
npm run test:unit         # all workspaces (CI)
npm run test:integration  # API + Docker/Testcontainers
npm run test:e2e          # Playwright (needs npm run dev)
npm run test:bench        # pure micro-benches
npm run test:bench:db     # DB/Redis benches (Docker or USE_EXISTING_INFRA=1)
npm run test:voice
npm run test:full         # unit + integration + voice (local; not e2e)
npm run ci                # typecheck + lint + unit + build + fallow
```

**CI** (`.github/workflows/ci.yml`): unit tests only (+ typecheck/lint/build/fallow). No integration/e2e/Docker.

## Agent habit

1. `npm run test:unit` after code changes  
2. API/DB → `test:integration` when Docker/infra available  
3. UI/routes/collab → `test:e2e` with full `npm run dev`
