# IDE sandbox (untrusted code + gVisor)

Local **isolated** execution target for realtime `@mockmatch/ide` experiments.

Treat everything inside as hostile: guest code gets **no internet**, **no host network**, **no privileges**, and a **read-only root filesystem**.

| Piece | Detail |
|-------|--------|
| Image | `mockmatch-sandbox:local` (minimal Debian + bash, Node 22, Python 3) |
| Runtime | **gVisor `runsc`** (default); `SANDBOX_RUNTIME=runc` only if needed |
| Network | **`network_mode: none`** — no NIC, no DNS, no egress, no published ports |
| User | `coder` (uid 1000), `no-new-privileges`, **all capabilities dropped** |
| FS | Root **read-only**; writable: `/workspace` (bind) + `/tmp` (64MB tmpfs, `noexec`) |
| Limits | 512MB RAM, 1 CPU, 256 pids, nproc/nofile ulimits |
| Access | **`docker exec` only** (no ttyd, no SSH, no open ports) |

## Threat model (local)

| Guest can | Guest cannot |
|-----------|----------------|
| Run node/python/bash under gVisor | Reach the internet or host services |
| Read/write `/workspace` | Write system paths (`/usr`, `/etc`, …) |
| Use `/tmp` (noexec) | Create new capabilities / setuid |
| Fork until pids/mem limit | Talk to Docker / other containers |

Not a multi-tenant prod hard boundary by itself — still one shared local box. Prod later: per-session containers + same profile.

## Prerequisites

```bash
npm run sandbox:install-gvisor   # once — registers hardened runsc
```

`runsc` args: `--network=none --net-raw=false --host-uds=none`.

Fallback without gVisor:

```powershell
$env:SANDBOX_RUNTIME="runc"; npm run sandbox:up
```

(`network_mode: none` + caps still apply under runc.)

## Commands (repo root)

`npm run dev` starts the sandbox first (`sandbox:up`), then app processes. Sandbox stays up after Ctrl+C.

```bash
npm run sandbox:install-gvisor   # once
npm run sandbox:up               # start (compose builds image if missing)
npm run sandbox:build            # rebuild after Dockerfile changes
npm run sandbox:smoke            # isolation + tool checks
npm run sandbox:shell            # interactive bash in /workspace
npm run sandbox:down
```

## Verify isolation

```bash
docker inspect -f "{{.HostConfig.Runtime}} network={{.HostConfig.NetworkMode}}" mockmatch-sandbox
# → runsc network=none

docker exec mockmatch-sandbox dmesg | head
# → Starting gVisor...

# Must fail (no NIC)
docker exec mockmatch-sandbox python3 -c "import socket; socket.socket().connect(('1.1.1.1', 80))"

# Must work
docker exec mockmatch-sandbox python3 /workspace/hello.py
docker exec mockmatch-sandbox node /workspace/hello.js
```

## Wiring `@mockmatch/ide` later

1. **MVP** — API `docker exec` line runner → `onCommand` prints stdout.
2. **Realtime PTY** — host-side PTY (`docker exec -it` / Docker attach API), **not** a port inside the guest.
3. **Prod** — same isolation profile, one container (or VM) per session; never share a sandbox across users.

Keep the API **process-stateless**: sandbox lifecycle lives in the orchestrator/Redis, not in one API pod’s memory.

## Env knobs

| Variable | Default | Meaning |
|----------|---------|---------|
| `SANDBOX_RUNTIME` | `runsc` | Docker runtime name |
| `SANDBOX_MEM_LIMIT` | `512m` | Memory (+ swap) cap |
| `SANDBOX_CPUS` | `1.0` | CPU cap |
| `SANDBOX_PIDS_LIMIT` | `256` | Max processes/threads |

## Layout

```
infra/sandbox/
  Dockerfile
  docker-compose.yml           # hardened sandbox service
  docker-compose.gvisor.yml    # runsc installer (hardened args)
  scripts/
    install-gvisor.sh
    smoke-test.sh
    entrypoint.sh              # sleep infinity — exec-only access
  workspace/                   # only guest-writable tree
```
