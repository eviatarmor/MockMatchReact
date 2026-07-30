# Sandbox runbooks

## Mass kill / cordon

```bash
# All labeled Docker session units (agent node)
docker ps -aq --filter label=mockmatch.sandbox=session | xargs -r docker rm -f
# Or
npm run sandbox:down

# Orchestrator reap endpoint
curl -X POST http://localhost:3010/v1/reap
```

## Node failure

1. Mark node down (stop agent).
2. Redis TTLs expire session records; clients get errors on next exec.
3. Users re-open workspace → new unit on healthy node.
4. Optional: orchestrator schedules away from dead `nodeId`.

## Guest CVE rebuild

1. Patch `infra/sandbox/Dockerfile`.
2. `npm run sandbox:build` / push signed image.
3. Roll agent nodes; destroy active sessions (force re-create).

## Suspected escape

1. `curl -X POST …/v1/reap` and `sandbox:down` on all agents.
2. Capture audit: `GET /v1/audit`.
3. Cordon agent nodes; rotate host credentials if Docker socket exposed.
4. Incident: treat as host compromise until proven otherwise.

## Prod config checklist

- [ ] `SANDBOX_ORCHESTRATOR_URL` set on api/ws
- [ ] api/ws: `SANDBOX_ORCHESTRATOR_URL` only (no Docker socket)
- [ ] agents: `SANDBOX_BACKEND=firecracker` (no gVisor/`runsc` required)
- [ ] `SANDBOX_FIRECRACKER_FALLBACK_DOCKER` **false** in prod
- [ ] `SANDBOX_ALLOW_INPROCESS_DOCKER_IN_PROD` **unset**
- [ ] Redis reachable by orchestrator
- [ ] Network policies: guests no route to Postgres/Redis/metadata
- [ ] Isolation suite / FC smoke green in CI
