# Sandbox isolation (multi-tenant production)

## Isolation backends (choose one boundary)

| Backend | Boundary | gVisor? | Typical use |
|---------|----------|---------|-------------|
| **firecracker** | MicroVM guest kernel | **No** — not used | Production multi-tenant |
| **docker** | Container + optional `runsc` | **Yes** if `SANDBOX_RUNTIME=runsc` | Local Windows/macOS / agents without KVM |
| **mock** | In-process fake | N/A | Unit tests |

**Rule:** do **not** stack gVisor under Firecracker. Firecracker already supplies a separate kernel; gVisor is only meaningful as the Docker path’s soft boundary.

```
SANDBOX_BACKEND=firecracker  →  microVM only (no runsc)
SANDBOX_BACKEND=docker       →  container ± gVisor (SANDBOX_RUNTIME)
```

## Guarantees (target 10/10 checklist)

| # | Requirement | Status in code |
|---|-------------|----------------|
| 1 | Dedicated untrusted compute path | Orchestrator + agent; api/ws use `SANDBOX_ORCHESTRATOR_URL` in prod |
| 2 | Strong isolation boundary | **Prod:** Firecracker microVM. **Local:** Docker ± gVisor + jail |
| 3 | No Docker on public api/ws pods | Prod env guard requires orchestrator URL |
| 4 | Default-deny network | No guest NIC / no route to cluster |
| 5 | One unit per session + wipe | Registry + destroy + optional host wipe |
| 6 | Short-lived tickets + collab authz | `signSandboxTicket` / scopes |
| 7 | Quotas / rate limits | Redis concurrent + hourly creates/execs |
| 8 | No platform secrets in guest | Guest env only `MOCKMATCH_*` |
| 9 | Multi-replica registry | Redis `sandbox:sess:*` |
| 10 | Automated isolation suite | `npm run sandbox:isolation` (Docker path) |

Residual risk: side-channels, hypervisor/kernel 0-days, host misconfig — not “unbreakable.”

## Architecture

```
IDE → ws/api  --ticket-->  Sandbox Orchestrator (:3010)
                              │ Redis registry/audit/quotas
                              ▼
                    SANDBOX_BACKEND=
              firecracker  |  docker (±gVisor)  |  mock
```

- **Local default:** `SANDBOX_BACKEND=docker`, `SANDBOX_RUNTIME=runsc`, empty orchestrator URL → in-process Docker on ws.
- **Production:** `SANDBOX_BACKEND=firecracker` on agent/orchestrator nodes; api/ws only `SANDBOX_ORCHESTRATOR_URL`. **No gVisor install required on Firecracker nodes.**

## Tickets

JWT `type=sandbox`, claims: `sub` userId, `sid` sessionId, `scp` `["run","pty"]`, TTL `SANDBOX_TICKET_TTL_SECONDS` (default 300s).  
Required in production.

## Ops

```bash
# Local (Docker + gVisor)
npm run sandbox:install-gvisor   # only for docker backend
npm run sandbox:up
npm run sandbox:isolation

# Prod agents (Firecracker — no gVisor; always latest from GitHub)
npm run sandbox:install-firecracker   # or auto on agent/orchestrator start
SANDBOX_BACKEND=firecracker
SANDBOX_FIRECRACKER_AUTO_UPDATE=true   # default — re-check latest on start + every 6h
SANDBOX_FIRECRACKER_HELPER=infra/sandbox/agent/run-firecracker.sh
# SANDBOX_FIRECRACKER_FALLBACK_DOCKER must stay false in prod
```

### Firecracker version policy

**Always latest.** `npm run sandbox:install-firecracker` and agent/orchestrator startup (when `SANDBOX_FIRECRACKER_AUTO_UPDATE=true`) fetch GitHub `releases/latest`, verify sha256 when available, and install under `infra/sandbox/agent/bin/`. No manual version pin.

## Runbooks

See `docs/sandbox-runbooks.md`.
