# Infra

## Local (Docker Compose)

PostgreSQL (pgvector + pgaudit), Redis, and **S3Proxy** (S3-compatible filesystem store).

All durable local data is bind-mounted under **`infra/volumes/`** (gitignored):

| Path | Service |
|------|---------|
| `volumes/postgres/` | PostgreSQL data |
| `volumes/redis/` | Redis data |
| `volumes/s3/` | S3Proxy backend (`s3/<bucket>/key…`) |

```bash
# from repo root
npm run infra:up
npm run infra:down
```

```
DATABASE_URL=postgresql://mockmatch:mockmatch@localhost:5432/mockmatch
REDIS_URL=redis://localhost:6379

# S3 via AWS SDK → S3Proxy (see api/.env.example)
AWS_S3_BUCKET=mockmatch
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=localsecret
S3_ENDPOINT=http://127.0.0.1:9090
```

Init SQL runs only on first Postgres data dir create. Wipe data: stop stack and delete `infra/volumes/*` (or only the service folder you need).

### S3Proxy

- Image: `andrewgaul/s3proxy` (filesystem provider)
- Host port: **9090** → container 80
- App uses **`@aws-sdk/client-s3`** with `forcePathStyle: true` and `S3_ENDPOINT`
- Seed exercises into the bucket: `cd api && npm run db:seed:exercises` (creates bucket + uploads)

API / worker / Drizzle Studio run on the host (`npm run dev`, etc.) — not in Compose.

## Production

No production provider stack in-repo yet. Point `AWS_*` at real S3 (or compatible) and leave `S3_ENDPOINT` empty for AWS.
