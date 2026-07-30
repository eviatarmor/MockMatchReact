# IDE sandbox (untrusted code + gVisor)

Local **isolated** execution for `@mockmatch/ide` collab workspaces.

**Model: one isolation unit per session + chroot jail.**  
Guest never sees the outer container rootfs (no Debian package DB, no real multi-user `/etc`, no sibling sessions).

**Production multi-tenant:** see **`docs/sandbox-isolation.md`**.

| Path | Isolation | gVisor? |
|------|-----------|---------|
| Local `SANDBOX_BACKEND=docker` | Container + jail + optional `runsc` | Optional (default on) |
| Prod `SANDBOX_BACKEND=firecracker` | MicroVM guest kernel | **No** — not used |

Do not stack gVisor under Firecracker.

| Piece | Detail |
|-------|--------|
| Image | `mockmatch-sandbox:local` (minimal Debian + bash, Node 22, Python 3) |
| Runtime | **gVisor `runsc`** (default); `SANDBOX_RUNTIME=runc` only if needed |
| Lifecycle | WS `docker run`s `mm-sbx-<sessionId>` on demand; removes on room empty / owner leave |
| Guest entry | All user code via **`jail-run`** → `chroot /opt/jail` as uid 1000 |
| Guest FS | `/workspace` (rw session files) + RO `/usr` toolchain + minimal `/etc` + `/tmp` |
| Network | **`network_mode: none`** — no NIC, no DNS, no egress, no published ports |
| Caps | Drop ALL; add only `SYS_ADMIN` / `SYS_CHROOT` / `SETUID` / `SETGID` / `MKNOD` for jail setup |
| Outer FS | Root **read-only**; guest cannot write `/usr`, outer `/etc`, … |
| Limits | 512MB RAM, 1 CPU, 256 pids, nproc/nofile ulimits |
| Access | **`docker exec` → `jail-run` only** (no ttyd, no SSH, no open ports) |

## Threat model (local)

| Guest can | Guest cannot |
|-----------|----------------|
| Run node/python/bash under gVisor | Reach the internet or host services |
| Read/write **its** `/workspace` | See other sessions' files |
| Read RO toolchain under `/usr` (needed for node/python) | See outer container `/etc` (Debian users, package DB, …) |
| Use `/tmp` (noexec) | `su` / root / leave the jail via normal paths |
| Fork until pids/mem limit | Talk to Docker / other containers |

**Why `/usr` is still visible:** interpreters and libc must live somewhere. “Only `/workspace` files and no toolchain” would break Run. The jail hides OS recon (`/etc/*-release` → stub “MockMatch Sandbox”, no `/var/lib/dpkg`).

Not a multi-tenant prod hard boundary by itself — still one shared local Docker host. Prod: same profile, still **one container (or VM) per session**.

## Prerequisites

```bash
npm run sandbox:install-gvisor   # once — registers hardened runsc
```

`runsc` args: `--network=none --net-raw=false --host-uds=none`.

Fallback without gVisor (set in `api/.env` and shell env):

```powershell
$env:SANDBOX_RUNTIME="runc"; npm run sandbox:up
```

## Commands (repo root)

`npm run dev` builds the sandbox image first (`sandbox:up`), then app processes. Session containers are created on first Run / terminal open.

```bash
npm run sandbox:install-gvisor   # once
npm run sandbox:up               # build image only
npm run sandbox:build            # same as sandbox:up
npm run sandbox:smoke            # ephemeral container + isolation checks
npm run sandbox:shell            # interactive bash (sample workspace mount)
npm run sandbox:down             # remove all session containers
```

## Verify isolation

```bash
npm run sandbox:smoke
```

Manual checks against a session container (after opening a dev workspace):

```bash
docker ps --filter label=mockmatch.sandbox=session
docker exec -u coder -w /workspace mm-sbx-<sessionId> python3 -c "import socket; socket.socket().connect(('1.1.1.1', 80))"
# must fail (no NIC)
```

## Wiring `@mockmatch/ide`

1. **Run / Run tests** — collab WS `sandbox.run` → ensure session container → sync files → `docker exec … jail-run -- <cmd>` → room-wide `sandbox.output`.
2. **Interactive shell (SSH-like)** — collab WS `sandbox.pty.*` → same container → `jail-run -- python3` PTY → bash inside chroot. Per-peer PTY; raw xterm keystrokes.
3. **Teardown** — owner leave or last peer out → `docker rm -f` session container.
4. **Prod** — same isolation profile, still one container (or VM) per session; never share a sandbox across sessions/users.

Keep the API **process-stateless**: in-flight AbortControllers are process-local; multi-replica still fans out output via Redis pub/sub. Docker runs on the pod that receives the WS message.

## Env knobs (`api/.env`)

| Variable | Default | Meaning |
|----------|---------|---------|
| `SANDBOX_CONTAINER_PREFIX` | `mm-sbx` | Container name prefix; empty disables sandbox |
| `SANDBOX_IMAGE` | `mockmatch-sandbox:local` | Image from `sandbox:up` |
| `SANDBOX_RUNTIME` | `runsc` | Docker runtime |
| `SANDBOX_MEM_LIMIT` | `512m` | Memory (+ swap) cap |
| `SANDBOX_CPUS` | `1.0` | CPU cap |
| `SANDBOX_PIDS_LIMIT` | `256` | Max processes/threads |
| `SANDBOX_WORKSPACE_DIR` | `infra/sandbox/workspace` | Host root; sessions live under `sessions/<id>` |

## Layout

```
infra/sandbox/
  Dockerfile
  docker-compose.yml           # image build + isolation profile reference
  docker-compose.gvisor.yml    # runsc installer (hardened args)
  scripts/
    install-gvisor.sh
    smoke-test.sh              # ephemeral session-style container
    stop-sessions.mjs          # sandbox:down
    entrypoint.sh              # sleep infinity — exec-only access
  workspace/                   # sample files + host session dirs (sessions/<id>)
```

## Host vs guest paths

| Host | Outer container | Guest (jail) |
|------|-----------------|--------------|
| `{SANDBOX_WORKSPACE_DIR}/sessions/{id}/package.json` | `/opt/jail/workspace/package.json` | `/workspace/package.json` |

Guest never sees `sessions/`, outer `/etc`, or other session ids.  
`cat /etc/os-release` inside the shell → **MockMatch Sandbox** stub only.
