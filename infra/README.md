# Infra

## Local (Docker Compose)

PostgreSQL (pgvector + pgaudit) and Redis for development.

```bash
# from repo root
npm run infra:up
npm run infra:down
```

```
DATABASE_URL=postgresql://mockmatch:mockmatch@localhost:5432/mockmatch
REDIS_URL=redis://localhost:6379
```

Init SQL runs only on first volume create. Re-init: `docker compose -f infra/docker-compose.yml down -v`.

API / worker / Drizzle Studio run on the host (`npm run dev`, etc.) — not in Compose.

## IDE sandbox (gVisor)

Local code-run / terminal target for `@mockmatch/ide`. See **[sandbox/README.md](./sandbox/README.md)**.

```bash
npm run sandbox:install-gvisor   # once — registers hardened runsc
npm run sandbox:up               # mockmatch-sandbox (no network, ro rootfs)
npm run sandbox:smoke
npm run sandbox:shell            # docker exec only — no published ports
npm run sandbox:down
```

Default runtime **gVisor `runsc`**, `network_mode: none`, no caps, read-only root. See `sandbox/README.md`.

## Production

No production provider stack in-repo yet (DigitalOcean / Terraform removed). Local Compose only for now.
