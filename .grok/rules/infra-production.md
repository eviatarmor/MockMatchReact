# Production infra (Terraform + hybrid cloud)

## Split

| Layer | Where |
|-------|--------|
| Local dev | `infra/docker-compose.yml` — Postgres (pgvector) + Redis |
| Production | `infra/terraform/` — DigitalOcean + GCP Secret Manager |
| K8s notes | `infra/k8s/README.md` |
| Apply guide | `infra/terraform/README.md` |

## Production architecture

- **DOKS** — `api` (HPA ≥2) + `worker`
- **Managed Postgres** — private VPC; durable identity + product data
- **Managed Valkey** — OTP, refresh hashes, BullMQ
- **DOCR** — container images
- **GCP Secret Manager** — secrets (not AWS SM; not DO-native SM)
- **External Secrets Operator** — GCP SM → K8s `Secret/mockmatch-app`
- **ingress-nginx + cert-manager** — TLS; paths `/trpc`, `/auth`, `/health`, `/ready`
- Future: Ingress `/ws` → `ws` Deployment

## Terraform layout (`infra/terraform/`)

- `network.tf` — VPC
- `database.tf` — Postgres + Valkey + firewall → DOKS only
- `doks.tf` — cluster + DOCR
- `secrets_gcp.tf` / `iam_gcp.tf` / `gcp_apis.tf` — SM + ESO SA
- `k8s_*.tf` — namespace, ESO, deployments, HPA, ingress
- `dns.tf` — optional DO domain records
- `outputs.tf` — LB IP, LinkedIn redirect URI, kubeconfig cmd
- State: prefer GCS backend (uncomment in `versions.tf`); never commit `*.tfstate`

## Secrets in GCP SM (namespaced by project/env)

- `database_url`, `redis_url`
- `jwt_access_secret`, `jwt_refresh_secret` (random 48-char)
- `linkedin_client_id`, `linkedin_client_secret`
- `app_url`, `api_url` (`https://<domain>`)

## OAuth accounts vs Terraform

- Terraform **does not** insert `oauth_accounts` rows.
- Terraform **does** provision secret slots + document redirect URI.
- LinkedIn developer app is **manual** in LinkedIn portal.
- Redirect URI exact: `https://<domain>/auth/oauth/linkedin/callback`  
  (`terraform output linkedin_redirect_uri`)

## Security defaults baked in

- DB/Valkey not public (VPC + DO DB firewall → k8s)
- API not world-exposed except via Ingress TLS
- No OTP stub in prod
- ESO SA: `secretAccessor` only on app secrets
- Pods non-root; JWT high entropy
- TF state sensitive — remote backend + locked IAM

## Phase roadmap

- **A (done scaffold):** TF + Redis auth + Docker + mermaid + LinkedIn secret slots
- **B:** `ws` Deployment + Redis pub/sub when mock interviews need realtime
- **C:** node autoscaler, staging cluster, Google OAuth optional
