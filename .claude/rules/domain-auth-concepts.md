# Domain: auth & data concepts (MockMatch)

Permanent project memory. Keep when changing auth, infra, or schema.

## What each thing is

### Access JWT
- Short-lived (15m). Signed with `JWT_ACCESS_SECRET`.
- **Not stored server-side.** Verify signature + `exp` only → true stateless hot path.
- Cookie / Authorization depending on client wiring.

### Refresh tokens
- Long-lived (30d) JWT signed with `JWT_REFRESH_SECRET`.
- **Server stores only SHA-256 hash in Redis** (`auth:refresh:<hash>`), TTL 30d.
- User index set: `auth:refresh:user:<userId>` for multi-device / global revoke.
- On refresh: verify JWT → lookup hash → **rotate** (DEL old, issue new pair).
- Logout → DEL hash. Any API replica can revoke (no sticky sessions).

### OTP challenges
- Email one-time codes for login/signup.
- **Redis only** (`auth:otp:<purpose>:<email>`), TTL = `OTP_TTL_MINUTES`.
- Payload: `codeHash`, `purpose`, `fullName` (signup), `attempts`.
- Login anti-enumeration: unknown email → success response, no OTP issued.
- `OTP_STUB_CODE` allowed only non-production; empty/forbidden in production.

### OAuth accounts (`oauth_accounts` table)
- **Runtime** link: MockMatch `users.id` ↔ IdP (`provider` + `provider_user_id`).
- UNIQUE(`provider`, `provider_user_id`).
- Created on successful OAuth callback — **never seed via Terraform/SQL init**.
- LinkedIn only for now; routes under `/auth/oauth/*` may still be stubs until handlers land.
- Secrets: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` (prod via GCP Secret Manager).

### Users (`users`)
- Durable identity in **Postgres**. Email unique. OTP signup / OAuth upsert.

### Questions (`questions`)
- Product question bank (domain/difficulty enums). Unrelated to auth. Postgres.

### Outbox events (`outbox_events`)
- Transactional outbox: write event row same TX as business change → relay to BullMQ/SQS.
- **Must stay Postgres** (ACID with business writes). Not Redis.

## JWT “stateless” myth (project decision)

| Token | Stateful store? | Why |
|-------|-----------------|-----|
| Access JWT | No | Cheap per-request auth |
| Refresh JWT | Yes — Redis hash | Logout, rotation, steal detection, multi-replica |

Stateless **API process** ≠ zero shared state. Shared state lives in Redis/Postgres so **any pod** can serve any request.

## Redis vs Postgres placement

| Data | Store |
|------|--------|
| Access JWT | Client only |
| Refresh token hash | **Redis** |
| OTP challenge | **Redis** |
| BullMQ jobs | **Redis** |
| users, oauth_accounts | **Postgres** |
| questions, outbox_events | **Postgres** |
| Uploads | Object storage (not local disk) |

## Key code paths

- Redis auth store: `api/src/lib/auth-store.ts`
- Auth service: `api/src/modules/auth/service.ts`
- JWT: `api/src/lib/jwt.ts`
- Schema (durable only): `api/src/db/schema/users.ts` (+ questions, outbox)
- Ephemeral tables dropped: migration `0001_drop_ephemeral_auth_tables.sql`
- OAuth stubs: `api/src/modules/auth/oauth-routes.ts`
