# MockMatch production infra (Terraform)

Stateless API on **DOKS**, data on **DigitalOcean managed Postgres + Valkey**, secrets in **GCP Secret Manager**, edge TLS via **ingress-nginx + cert-manager**.

Local dev still uses `infra/docker-compose.yml` (not this stack).

## Architecture

- **DOKS** — `api` (HPA, ≥2 replicas) + `worker` (BullMQ)
- **Managed Postgres** — durable identity (`users`, `oauth_accounts`, product tables); private VPC only
- **Managed Valkey** — OTP, refresh token hashes, BullMQ (shared across pods → no sticky sessions)
- **GCP Secret Manager** — `DATABASE_URL`, `REDIS_URL`, JWT secrets, LinkedIn OAuth, public URLs
- **External Secrets Operator** — syncs GCP SM → K8s `Secret/mockmatch-app`
- **Ingress** — HTTPS for `/trpc`, `/auth`, `/health`, `/ready` (path `/ws` later)

Stateless contract: any API pod can handle any request. Access JWTs verified in-process; refresh/OTP state only in Valkey.

## Prerequisites

1. DigitalOcean account + API token (`export DIGITALOCEAN_TOKEN=...`)
2. GCP project with Secret Manager API enabled + credentials (`gcloud auth application-default login` or `GOOGLE_APPLICATION_CREDENTIALS`)
3. Terraform ≥ 1.6, `doctl`, `kubectl`, Docker
4. Domain you control (DNS A → Ingress LB IP after apply)

Optional: GCS bucket for remote state (uncomment `backend "gcs"` in `versions.tf`).

## Quick start

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# edit domain, gcp_project, regions, linkedin_* when ready

terraform init
terraform plan
terraform apply
```

Fetch kubeconfig:

```bash
doctl kubernetes cluster kubeconfig save $(terraform output -raw doks_cluster_name)
```

Point DNS A record for `domain` at:

```bash
terraform output ingress_load_balancer_ip
```

## Build & push API image

```bash
# from repo root
doctl registry login
IMAGE="$(terraform -chdir=infra/terraform output -raw docr_endpoint)/mockmatch-api:$(git rev-parse --short HEAD)"
docker build -f api/Dockerfile -t "$IMAGE" .
docker push "$IMAGE"

# set api_image in tfvars and re-apply, or:
kubectl -n mockmatch set image deploy/api api="$IMAGE"
kubectl -n mockmatch set image deploy/worker worker="$IMAGE"
```

## Database migrations

Run once per release against managed Postgres (from CI or a Job with secrets mounted):

```bash
export DATABASE_URL=...   # from GCP SM or kubectl get secret
cd api && npm run db:migrate
```

Prefer a one-shot K8s Job over migrate-on-boot (avoids multi-replica races).

## LinkedIn OAuth portal setup

1. Create app at [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Products: Sign In with LinkedIn using OpenID Connect (as required)
3. **Authorized redirect URL** (exact):

   ```text
   https://<your-domain>/auth/oauth/linkedin/callback
   ```

   Also printed by: `terraform output linkedin_redirect_uri`

4. Put Client ID / Secret into `terraform.tfvars` and `terraform apply`, **or**:

   ```bash
   printf '%s' 'YOUR_ID' | gcloud secrets versions add mockmatch-prod-linkedin-client-id --data-file=-
   printf '%s' 'YOUR_SECRET' | gcloud secrets versions add mockmatch-prod-linkedin-client-secret --data-file=-
   ```

5. App routes under `/auth/oauth/*` are still stubs until OAuth handlers are implemented; secrets + redirect path are production-ready.

## Security notes

| Control | Implementation |
|---------|----------------|
| DB/Valkey not public | VPC + DO database firewall → DOKS only |
| Secrets not in git | GCP SM + ESO; `.tfvars` gitignored |
| No OTP stub in prod | `OTP_STUB_CODE=""` + env validation |
| JWT entropy | 48-char random from Terraform |
| TLS | cert-manager Let’s Encrypt |
| Pods non-root | securityContext on Deployments |
| SA key for ESO | single K8s secret; rotate via TF taint/recreate |

**State file is sensitive** (DB passwords, JWT material). Use remote GCS backend + restricted IAM. Never commit `*.tfstate`.

## Destroy

```bash
terraform destroy
```

Also delete GCP secrets / DOCR images if you want a full cleanup.

## Phase B (WebSockets)

Add a `ws` Deployment + Ingress path `/ws` with Redis pub/sub adapter. See `infra/k8s/README.md`. No auth redesign required if OTP/refresh already use Valkey.
