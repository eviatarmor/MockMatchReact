#!/usr/bin/env bash
# Verify sandbox isolation + tools.
set -euo pipefail

NAME="${SANDBOX_CONTAINER_NAME:-mockmatch-sandbox}"
RUNTIME="${SANDBOX_RUNTIME:-runsc}"

echo "==> Container"
runtime=$(docker inspect -f '{{.HostConfig.Runtime}}' "$NAME")
net=$(docker inspect -f '{{.HostConfig.NetworkMode}}' "$NAME")
ro=$(docker inspect -f '{{.HostConfig.ReadonlyRootfs}}' "$NAME")
user=$(docker inspect -f '{{.Config.User}}' "$NAME")
echo "runtime=$runtime network=$net readonly_rootfs=$ro user=$user"

if [ "$net" != "none" ]; then
  echo "FAIL: expected network_mode=none" >&2
  exit 1
fi
if [ "$ro" != "true" ]; then
  echo "FAIL: expected read-only rootfs" >&2
  exit 1
fi

echo "==> uname / tools"
docker exec "$NAME" uname -a
docker exec "$NAME" node -v
docker exec "$NAME" python3 --version
docker exec "$NAME" ls /workspace

echo "==> workspace write + run"
docker exec "$NAME" python3 /workspace/hello.py
docker exec "$NAME" node /workspace/hello.js

echo "==> rootfs must be read-only"
if docker exec "$NAME" sh -c 'echo pwn > /etc/pwned' 2>/dev/null; then
  echo "FAIL: wrote to /etc" >&2
  exit 1
fi
echo "OK: cannot write /etc"

echo "==> network must be dead"
if docker exec "$NAME" python3 -c "import socket; s=socket.socket(); s.settimeout(2); s.connect(('1.1.1.1', 80))" 2>/dev/null; then
  echo "FAIL: outbound TCP succeeded" >&2
  exit 1
fi
echo "OK: no outbound TCP"

if [ "$RUNTIME" = "runsc" ] || [ "$runtime" = "runsc" ]; then
  echo "==> gVisor"
  if docker exec "$NAME" dmesg 2>/dev/null | grep -qi gvisor; then
    echo "OK: gVisor banner"
  elif [ "$runtime" = "runsc" ]; then
    echo "OK: runtime is runsc"
  else
    echo "FAIL: expected runsc" >&2
    exit 1
  fi
fi

echo "Smoke complete — sandbox is isolated."
