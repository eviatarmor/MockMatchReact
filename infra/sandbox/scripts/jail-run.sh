#!/usr/bin/env bash
# Run a command as coder inside the filesystem jail (/opt/jail).
# Guest view: /workspace (rw) + RO toolchain (/usr, …). No outer container FS.
set -euo pipefail

JAIL=/opt/jail
READY=/run/jail-ready

# Wait for entrypoint bind-mounts (session container just started).
for _ in $(seq 1 100); do
  if [[ -f "$READY" ]] && [[ -x "$JAIL/usr/bin/bash" || -x "$JAIL/bin/bash" ]]; then
    break
  fi
  sleep 0.05
done

if [[ ! -f "$READY" ]]; then
  echo "jail-run: jail not ready (entrypoint mounts failed?)" >&2
  exit 127
fi

if [[ "${1:-}" == "--" ]]; then
  shift
fi

if [[ $# -eq 0 ]]; then
  set -- /bin/bash -l
fi

# Clean env inside jail — no outer paths leaked via ENV.
# cwd always /workspace after chroot.
exec chroot --userspec=1000:1000 "$JAIL" /usr/bin/env -i \
  HOME=/workspace \
  USER=coder \
  LOGNAME=coder \
  TERM="${TERM:-xterm-256color}" \
  PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  LANG=C.UTF-8 \
  MOCKMATCH_SANDBOX=1 \
  MOCKMATCH_JAIL=1 \
  /bin/bash --noprofile --norc -c 'cd /workspace && exec "$@"' \
  bash \
  "$@"
