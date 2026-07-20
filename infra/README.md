# Infra (local Docker)

PostgreSQL (pgvector + pgaudit), Redis (BullMQ), optional Drizzle Studio.

## Prerequisites

- Docker Desktop with **Linux containers**
- Ports free: `5432`, `6379`, (optional) `4983`

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

Drizzle Studio (tools profile):

```bash
docker compose -f infra/docker-compose.yml --profile tools up -d drizzle-studio
```

Open http://localhost:4983 (or run `npm run db:studio --workspace=@mockmatch/api` on the host).

## Connection strings

```
DATABASE_URL=postgresql://mockmatch:mockmatch@localhost:5432/mockmatch
REDIS_URL=redis://localhost:6379
```

## Extensions

Init script enables `vector`, `pgaudit`, `pgcrypto`.  
`pgaudit` needs `shared_preload_libraries=pgaudit` (set in `postgres/Dockerfile` CMD).

**Note:** Init SQL runs only on first volume create. To re-init, `docker compose down -v` (destroys data).

## API / worker

Not containerized yet — run on host with `tsx` for fast reload:

```bash
npm run dev:api
npm run dev:worker
```
