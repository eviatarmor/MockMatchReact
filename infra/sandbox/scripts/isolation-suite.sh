#!/usr/bin/env bash
# Isolation / multi-tenant assurance checks (local Docker backend).
# Exit non-zero on failure. Used by npm run sandbox:isolation
set -euo pipefail

IMAGE="${SANDBOX_IMAGE:-mockmatch-sandbox:local}"
RUNTIME="${SANDBOX_RUNTIME:-runsc}"
A="mm-isolation-a-$$"
B="mm-isolation-b-$$"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/../workspace"
WA="$ROOT/sessions/isolation-a-$$"
WB="$ROOT/sessions/isolation-b-$$"

cleanup() {
  docker rm -f "$A" "$B" >/dev/null 2>&1 || true
  rm -rf "$WA" "$WB" 2>/dev/null || true
}
trap cleanup EXIT

mkdir -p "$WA" "$WB"
echo "secret-a" >"$WA/secret.txt"
echo "secret-b" >"$WB/secret.txt"

run_box() {
  local name=$1 dir=$2
  local args=(
    run -d --name "$name"
    --network none --read-only
    --security-opt no-new-privileges
    --cap-drop ALL
    --cap-add SYS_ADMIN --cap-add SYS_CHROOT --cap-add SETUID --cap-add SETGID --cap-add MKNOD
    --tmpfs /tmp:size=64m,mode=1777,noexec
    --tmpfs /run:size=8m,mode=755
    -u 0:0
    -v "${dir}:/opt/jail/workspace"
    --label mockmatch.sandbox=session
  )
  if [[ -n "$RUNTIME" ]]; then args+=(--runtime "$RUNTIME"); fi
  args+=("$IMAGE")
  docker "${args[@]}"
}

echo "==> image"
docker image inspect "$IMAGE" >/dev/null

echo "==> two session containers"
run_box "$A" "$WA"
run_box "$B" "$WB"
sleep 1

echo "==> network deny"
if docker exec "$A" jail-run -- python3 -c "import socket;s=socket.socket();s.settimeout(2);s.connect(('1.1.1.1',80))" 2>/dev/null; then
  echo "FAIL: egress allowed" >&2
  exit 1
fi
echo "OK: no egress"

echo "==> cross-session file isolation"
if docker exec "$A" jail-run -- cat /workspace/secret.txt | grep -q secret-a; then
  echo "OK: A sees own secret"
else
  echo "FAIL: A missing secret" >&2
  exit 1
fi
if docker exec "$A" jail-run -- cat /workspace/secret.txt | grep -q secret-b; then
  echo "FAIL: A can see B secret" >&2
  exit 1
fi
echo "OK: A cannot see B secret content"

echo "==> jail os-release stub"
osrel=$(docker exec "$A" jail-run -- cat /etc/os-release)
echo "$osrel" | grep -q "MockMatch Sandbox"
echo "OK: stub os-release"

echo "==> no dpkg in jail"
if docker exec "$A" jail-run -- test -d /var/lib/dpkg 2>/dev/null; then
  echo "FAIL: dpkg visible" >&2
  exit 1
fi
echo "OK: no package db"

echo "==> wipe destroy"
docker rm -f "$A" >/dev/null
if docker ps -a --format '{{.Names}}' | grep -qx "$A"; then
  echo "FAIL: container still listed" >&2
  exit 1
fi
echo "OK: destroy"

echo "Isolation suite PASSED"
