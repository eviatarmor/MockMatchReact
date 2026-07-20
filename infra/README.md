# Infra (local Docker)

PostgreSQL (pgvector + pgaudit) and Redis (BullMQ).

Drizzle Studio runs on the host via `npm run dev` (or `npm run dev:studio`), not in Docker.

## Prerequisites

- Docker Desktop with **Linux containers**
- Ports free: `5432`, `6379`

## Up / down

From repo root:

```bash
npm run infra:up
npm run infra:down
```

Or:

```bash
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml down
```

## Connection strings

```
DATABASE_URL=postgresql://mockmatch:mockmatch@localhost:5432/mockmatch
REDIS_URL=redis://localhost:6379
```

## Extensions

Init script enables `vector`, `pgaudit`, `pgcrypto`.  
`pgaudit` needs `shared_preload_libraries=pgaudit` (set in `postgres/Dockerfile` CMD).

**Note:** Init SQL runs only on first volume create. To re-init, `docker compose down -v` (destroys data).

## API / worker / Studio

Not containerized — run on host:

```bash
npm run dev          # client + api + Drizzle Studio
npm run dev:api
npm run dev:worker
npm run dev:studio   # Drizzle Studio only → https://local.drizzle.studio
```
