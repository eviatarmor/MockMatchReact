# Ops checklists (local + prod)

## Local development

```bash
# from repo root
npm run infra:up                    # Postgres + Redis
cp api/.env.example api/.env        # if needed
cd api && npm run db:migrate        # through 0004 account prefs + credits/billing
npm run dev                         # client + api + studio
# or:
npm run dev:api
npm run dev:worker
```

Env notes:
- `OTP_STUB_CODE=000000` OK in development
- Redis required for login/signup/refresh (not optional)
- `DATABASE_URL`, `REDIS_URL`, JWT secrets required
- Stripe optional locally: leave `STRIPE_*` empty → Free plan + credits UI still works; top-up disabled
- Local Stripe webhooks (when keys set): `stripe listen --forward-to localhost:3000/billing/webhook`

## Schema ER diagram

```bash
npm run db:schema:mermaid
# → api/docs/schema.md + api/docs/schema.mmd
# Re-run after schema changes / db:generate
```

## Production bootstrap (ordered steps)

1. **Prereqs**
   - DigitalOcean token: `export DIGITALOCEAN_TOKEN=...`
   - GCP project + Secret Manager API; ADC: `gcloud auth application-default login`
   - Domain you control; Terraform ≥ 1.6; doctl; kubectl; Docker

2. **Configure TF**
   ```bash
   cd infra/terraform
   cp terraform.tfvars.example terraform.tfvars
   # set: domain, gcp_project, do_region, admin_cidrs, linkedin_* when ready
   # optional: uncomment GCS backend in versions.tf
   ```

3. **Apply**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```
   Note: ESO CRDs may need a second apply if `kubernetes_manifest` races Helm install.

4. **Kubeconfig**
   ```bash
   doctl kubernetes cluster kubeconfig save $(terraform output -raw doks_cluster_name)
   ```

5. **DNS**
   - Point domain A record → `terraform output ingress_load_balancer_ip`
   - Wait for cert-manager Let’s Encrypt

6. **LinkedIn portal (manual once)**
   - Create LinkedIn app; enable Sign In / OIDC products as needed
   - Authorized redirect URL = `terraform output linkedin_redirect_uri`
   - Put client id/secret in tfvars and re-apply, **or** `gcloud secrets versions add ...`

7. **Build & push image**
   ```bash
   # repo root
   doctl registry login
   IMAGE="$(terraform -chdir=infra/terraform output -raw docr_endpoint)/mockmatch-api:$(git rev-parse --short HEAD)"
   docker build -f api/Dockerfile -t "$IMAGE" .
   docker push "$IMAGE"
   # set api_image in tfvars + apply, or:
   kubectl -n mockmatch set image deploy/api api="$IMAGE"
   kubectl -n mockmatch set image deploy/worker worker="$IMAGE"
   ```

8. **Migrations (once per release)**
   ```bash
   # DATABASE_URL from GCP SM or kubectl secret mockmatch-app
   cd api && npm run db:migrate
   ```
   Prefer CI Job, not migrate-on-every-pod-start.

9. **Verify**
   - `curl https://<domain>/health`
   - `curl https://<domain>/ready` → postgres+redis ok
   - Scale api ≥2; login/refresh still works (Redis shared)

10. **Destroy** (when tearing down)
    ```bash
    cd infra/terraform && terraform destroy
    ```

## Not done yet (do not assume implemented)

- Full LinkedIn OAuth authorize/callback handlers (stubs + env/secrets only)
- WebSocket service (`src/ws.ts`) + Ingress `/ws`
- Google OAuth
- Automatic migrate Job in cluster (document manual/CI for now)
