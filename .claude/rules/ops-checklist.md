# Ops checklists

## Local development

```bash
# from repo root
npm run infra:up                    # Postgres + Redis
cp api/.env.example api/.env        # if needed
cd api && npm run db:migrate        # through 0005 document collab shares
npm run sandbox:install-gvisor      # once — gVisor runsc (IDE sandbox)
npm run dev                         # sandbox + client + api + ws + worker + studio
# or split:
npm run dev:api
npm run dev:ws                      # collab WebSocket :3001
npm run dev:worker                  # BullMQ + collab Postgres flush
```

Env notes:
- `OTP_STUB_CODE=000000` OK in development
- Redis required for login/signup/refresh + collab (not optional)
- `DATABASE_URL`, `REDIS_URL`, JWT secrets required
- `WS_URL=ws://localhost:3001`, `WS_PORT=3001`, `COLLAB_FLUSH_DELAY_MS=8000`
- Local collab testing: `FREE_CREDIT_GRANT=100` (or call `collab.grantDevCredits` in dev) so share links unlock
- Share links stay active **while the owner is in the document**; expire when owner leaves (reopen does not revive). Roles: `view` | `edit` (owner full)
- Stripe optional locally: leave `STRIPE_*` empty → Free plan + credits UI still works; top-up disabled
- Local Stripe webhooks (when keys set): `stripe listen --forward-to localhost:3000/billing/webhook`
- PDF export (resume/cover letter): install Chromium once — `cd api && npx playwright install chromium`
  - API opens `${APP_URL}/resumes/:id/print` (or cover-letters) headless with a short-lived access cookie
  - Client must be reachable at `APP_URL` (default `http://localhost:5173`) while exporting

## Schema ER diagram

```bash
npm run db:schema:mermaid
# → api/docs/schema.md + api/docs/schema.mmd
# Re-run after schema changes / db:generate
```

## IDE sandbox (gVisor) — optional, for `@mockmatch/ide` realtime

```bash
npm run sandbox:install-gvisor   # once — hardened runsc (network=none)
npm run sandbox:up               # build image (session containers created on demand)
npm run sandbox:smoke            # ephemeral isolation check
npm run sandbox:shell            # interactive bash (sample mount)
npm run sandbox:down             # remove all mm-sbx-* session containers
```

Docs: `infra/sandbox/README.md`, `docs/sandbox-isolation.md`, `docs/sandbox-runbooks.md`.  
One isolation unit per collab session; guest root `/workspace`.  
Local: Docker+gVisor backend (optional orchestrator on :3010). Prod: `SANDBOX_ORCHESTRATOR_URL` on api/ws.  
Fallback: `$env:SANDBOX_RUNTIME="runc"` in `api/.env`, then `npm run sandbox:up`.  
Isolation suite: `npm run sandbox:isolation`.


## Production

No in-repo production bootstrap (DigitalOcean / Terraform removed). Revisit when a new host is chosen.

## Not done yet (do not assume implemented)

- Production hosting / IaC
- Full LinkedIn OAuth authorize/callback handlers (stubs + env/secrets only)
- Google OAuth
