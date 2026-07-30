#!/usr/bin/env bash
# Verify per-session jail isolation + tools.
set -euo pipefail

IMAGE="${SANDBOX_IMAGE:-mockmatch-sandbox:local}"
RUNTIME="${SANDBOX_RUNTIME:-runsc}"
NAME="mockmatch-sandbox-smoke-$$"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="${SANDBOX_SMOKE_WORKSPACE:-$SCRIPT_DIR/../workspace}"

cleanup() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "==> Image: $IMAGE"
if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "FAIL: image missing — run npm run sandbox:up" >&2
  exit 1
fi

RUN_ARGS=(
  run -d
  --name "$NAME"
  --network none
  --read-only
  --security-opt no-new-privileges
  --cap-drop ALL
  --cap-add SYS_ADMIN
  --cap-add SYS_CHROOT
  --cap-add SETUID
  --cap-add SETGID
  --cap-add MKNOD
  --memory 512m
  --memory-swap 512m
  --cpus 1.0
  --pids-limit 256
  --tmpfs /tmp:size=64m,mode=1777,noexec,nosuid,nodev
  --tmpfs /run:size=8m,mode=755,nosuid,nodev
  -u 0:0
  -w /opt/jail/workspace
  -e HOME=/workspace
  -e MOCKMATCH_SANDBOX=1
  -v "${WORKSPACE}:/opt/jail/workspace"
  --label mockmatch.sandbox=smoke
)

if [ -n "$RUNTIME" ]; then
  RUN_ARGS+=(--runtime "$RUNTIME")
fi
RUN_ARGS+=("$IMAGE")

echo "==> Start ephemeral session-style container"
docker "${RUN_ARGS[@]}"

# Wait for jail-ready
for _ in $(seq 1 50); do
  if docker exec "$NAME" test -f /run/jail-ready 2>/dev/null; then
    break
  fi
  sleep 0.1
done

echo "==> Container"
runtime=$(docker inspect -f '{{.HostConfig.Runtime}}' "$NAME")
net=$(docker inspect -f '{{.HostConfig.NetworkMode}}' "$NAME")
ro=$(docker inspect -f '{{.HostConfig.ReadonlyRootfs}}' "$NAME")
echo "runtime=$runtime network=$net readonly_rootfs=$ro"

if [ "$net" != "none" ]; then
  echo "FAIL: expected network_mode=none" >&2
  exit 1
fi
if [ "$ro" != "true" ]; then
  echo "FAIL: expected read-only rootfs" >&2
  exit 1
fi

echo "==> jail tools"
docker exec "$NAME" jail-run -- uname -a
docker exec "$NAME" jail-run -- node -v
docker exec "$NAME" jail-run -- python3 --version

echo "==> workspace run (inside jail)"
docker exec "$NAME" jail-run -- python3 /workspace/hello.py
docker exec "$NAME" jail-run -- node /workspace/hello.js

echo "==> jail /etc must not be full Debian recon"
osrel=$(docker exec "$NAME" jail-run -- cat /etc/os-release)
echo "$osrel"
if echo "$osrel" | grep -qi 'debian\|ubuntu\|bookworm'; then
  echo "FAIL: jail leaked real distro identity" >&2
  exit 1
fi
if ! echo "$osrel" | grep -q 'MockMatch Sandbox'; then
  echo "FAIL: expected sandbox os-release" >&2
  exit 1
fi

echo "==> jail must not expose outer home/var package trees"
if docker exec "$NAME" jail-run -- test -d /var/lib/dpkg 2>/dev/null; then
  echo "FAIL: /var/lib/dpkg visible inside jail" >&2
  exit 1
fi
echo "OK: no /var/lib/dpkg in jail"

echo "==> outer rootfs still RO (control plane)"
if docker exec "$NAME" sh -c 'echo pwn > /etc/pwned' 2>/dev/null; then
  echo "FAIL: wrote to outer /etc" >&2
  exit 1
fi
echo "OK: cannot write outer /etc"

echo "==> network must be dead"
if docker exec "$NAME" jail-run -- python3 -c "import socket; s=socket.socket(); s.settimeout(2); s.connect(('1.1.1.1', 80))" 2>/dev/null; then
  echo "FAIL: outbound TCP succeeded" >&2
  exit 1
fi
echo "OK: no outbound TCP"

if [ "$RUNTIME" = "runsc" ] || [ "$runtime" = "runsc" ]; then
  echo "==> gVisor"
  if [ "$runtime" = "runsc" ]; then
    echo "OK: runtime is runsc"
  else
    echo "FAIL: expected runsc" >&2
    exit 1
  fi
fi

echo "Smoke complete — jail isolation profile OK."
