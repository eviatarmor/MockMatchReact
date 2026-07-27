# Stateless API contract (multi-replica ready)

Hard rules for all API / worker / future WebSocket work. Violating these makes horizontal scaling hard on any host.

## Rules

1. **No in-process session state** — no module-level Maps for sessions, OTP, refresh allowlists.
2. **No local disk for user data** — uploads → object storage signed URLs.
3. **Config via env only** — secrets from env / platform secret store.
4. **Access JWT** — verify only; no DB/Redis on hot path.
5. **Refresh / OTP / logout** — shared Redis so any replica works.
6. **BullMQ** — Redis-backed queues only.
7. **No sticky sessions** for REST/tRPC. WebSockets: prefer Redis pub/sub adapter over stickiness.
8. **Health probes**
   - `GET /health` — liveness (process up)
   - `GET /ready` — readiness (Postgres + Redis); fail → 503
9. **Graceful shutdown** — drain; especially important for future WS.
10. **Migrations** — release Job / CI once, not every replica on boot.

## Scaling model

```
Load balancer → api (HPA / multi-instance)   # stateless REST/tRPC
             → worker                         # BullMQ consumers
             → ws (future)                    # sockets + Redis adapter
```

Adding WS autoscaling must **not** require redesigning auth storage if Redis rules above hold.

## Prod env guards (`api/src/config/env.ts`)

- `NODE_ENV=production` → `OTP_STUB_CODE` must be empty
- JWT secrets ≥ 32 chars in production
- LinkedIn: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`

## Docker

- Build from monorepo root: `docker build -f api/Dockerfile -t mockmatch-api .`
- Image runs API via `tsx` (schemas package is TS source)
- Worker override: `npx tsx src/worker.ts`
