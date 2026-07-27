# Production infra

## Status

DigitalOcean (DOKS, managed Postgres/Valkey, DOCR) + Terraform + GCP Secret Manager scaffold **removed**. No production provider stack in-repo.

| Layer | Where |
|-------|--------|
| Local dev | `infra/docker-compose.yml` — Postgres (pgvector) + Redis |
| Production | TBD — not DigitalOcean |

## What still applies (host-agnostic)

- **Process-stateless API** — shared state only in Redis / Postgres / object storage (see `stateless-api-contract.md`)
- **Access JWT** — client only; verify in-process
- **Refresh hash + OTP** — Redis
- **users / oauth_accounts** — Postgres; oauth rows at runtime only (never seed via IaC)
- **No OTP stub in production** (`OTP_STUB_CODE` empty when `NODE_ENV=production`)
- **LinkedIn secrets** via env: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`
- LinkedIn developer app is **manual** in LinkedIn portal; redirect URI: `https://<domain>/auth/oauth/linkedin/callback`

## Local only

```bash
npm run infra:up     # Postgres + Redis
npm run infra:down
```

See `ops-checklist.md` for local boot steps.
