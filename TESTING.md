# Testing

## Layout

```
tools/vitest/                  # shared Vitest config factory + jsdom setup
api/
  src/                         # production
  tests/
    setup/ helpers/ unit/ integration/ bench/
    # helpers/trpc-http.ts — tRPC wire (shared with client E2E)
client/
  src/
  tests/
    setup/ unit/
    e2e/                       # Playwright
      helpers/
      public | auth | dashboard | resume-lab | collab-ws
packages/<name>/
  src/                         # production only
  tests/unit/                  # (+ optional tests/bench)
```

Voice: `voice/tests/` (Python unittest).

Vitest is pinned **once** at the monorepo root (`^3.2.7`). Package configs are thin wrappers around `tools/vitest/create-config.ts`.

## Stack

| Layer | Tool |
|-------|------|
| Unit | Vitest (`tests/unit`) |
| API integration | Vitest + Testcontainers (`api/tests/integration`) |
| Browser E2E | Playwright (`client/tests/e2e`) |
| Packages | Vitest (`packages/*/tests/unit`) |
| **Benchmarks** | Vitest `bench` (`tests/bench/**/*.bench.ts`) |

## Commands

```bash
npm run test              # → test:unit
npm run test:unit         # all workspaces with test:unit (--if-present)
npm run test:integration  # API + Docker/Testcontainers
npm run test:e2e          # Playwright (needs npm run dev)
npm run test:bench        # pure micro-benches (workspaces with test:bench)
npm run test:bench:db     # DB/Redis/Hono benches
npm run test:voice
npm run test:full         # unit + integration + voice
npm run typecheck:tests   # tsc API tests + src (api/tsconfig.tests.json)
npm run ci                # typecheck + lint + unit + build + fallow
```

## CI (`.github/workflows/ci.yml`)

| Job | What |
|-----|------|
| `quality` | typecheck (api + api tests + client), lint, **unit**, build |
| `integration` | `REQUIRE_INTEGRATION=1 npm run test:integration` — **fails** if Docker/Testcontainers unavailable (no silent skip) |
| `fallow` | audit / SARIF |

E2E is still local-only (`npm run test:e2e` with full `npm run dev`).

## API integration

```bash
npm run test:integration
# or: USE_EXISTING_INFRA=1 npm run test:integration
# CI: REQUIRE_INTEGRATION=1 (fail if infra down)
```

Skip-vs-fail:

| Env | Missing Docker |
|-----|----------------|
| (default local) | suites `describe.skip` |
| `REQUIRE_INTEGRATION=1` | suites fail with reason from globalSetup |

`FREE_CREDIT_GRANT` is forced to `0` only when Testcontainers/existing infra is available (collab paid-gate tests). Unit tests use `??= "0"` without clobbering an explicit env.

## Playwright E2E

| Spec | Coverage |
|------|----------|
| `public.spec.ts` | Home, login/signup, unauth gate, 404 |
| `auth.spec.ts` | API + UI OTP signup/login |
| `dashboard.spec.ts` | Authenticated route matrix (**one signup per suite**) |
| `resume-lab.spec.ts` | Create → editor → list |
| `collab-ws.spec.ts` | WS ticket + snapshot; guest share join |

Helpers: `fillOtp`, `authenticatedContext`, `openCollabWs` / `connectCollabWs` / `holdCollabWs`.  
tRPC HTTP wire: `api/tests/helpers/trpc-http.ts` (shared with API HTTP benches).

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

## Benchmarks (hot paths only)

Micro-benches — **not** k6 multi-client load.

| Workspace | File(s) | What |
|-----------|---------|------|
| `@mockmatch/api` | `path-op`, `crypto`, `embeddings` | LWW, SHA-256 OTP, cosine |
| `@mockmatch/schemas` | `parse` | Zod resume / OTP / job search |
| `@mockmatch/collab` | `path-op`, `json-y` | LWW + Yjs bridge |
| `@mockmatch/whiteboard` | `geometry` | hit-test, RDP simplify |
| `@mockmatch/document-assistant` | `replace` | find/replace, stripHtml |

DB benches: `api/tests/bench/db/*` via `npm run test:bench:db`.

## Agent habit

1. `npm run test:unit` after code changes  
2. API/DB → `test:integration` when Docker/infra available  
3. UI/routes/collab → `test:e2e` with full `npm run dev`
