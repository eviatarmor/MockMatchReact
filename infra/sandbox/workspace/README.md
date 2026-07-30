# Sandbox workspace (host)

- **Sample files** at this root (`hello.py`, …) — used by `npm run sandbox:smoke` / `sandbox:shell`.
- **Live sessions** under `sessions/<sessionId>/` on the host only.
  Each session gets its **own container**; that dir bind-mounts to `/opt/jail/workspace`
  and appears as guest **`/workspace`** inside the chroot jail (`jail-run`).
  Guest never sees `sessions/`, sibling sessions, or the outer container rootfs.

## Smoke commands (inside a container)

```bash
python3 hello.py
node hello.js
uname -a
dmesg | head   # under runsc → gVisor banner
```
