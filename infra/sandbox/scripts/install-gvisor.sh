#!/usr/bin/env bash
# Install gVisor (runsc) into Docker Desktop / Linux Docker and register the runtime.
# Safe to re-run. After install, `docker info` should list runtime "runsc".
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE=(docker compose -f "$ROOT/docker-compose.gvisor.yml")

echo "==> Downloading runsc into Docker volume + registering runtime"
"${COMPOSE[@]}" run --rm runsc-installer

echo "==> Reloading dockerd (SIGHUP) so runsc is live without full Desktop restart"
docker run --rm --pid host --privileged alpine:3.20 sh -c '
  set -e
  pid=$(ps | awk "/dockerd/ && !/awk/ {print \$1; exit}")
  if [ -z "$pid" ]; then
    echo "dockerd not found in host pid ns" >&2
    exit 1
  fi
  echo "Sending HUP to dockerd pid=$pid"
  kill -HUP "$pid"
'

echo "==> Waiting for Docker API"
for i in $(seq 1 30); do
  if docker info >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "==> Runtimes:"
docker info 2>/dev/null | sed -n '/Runtimes:/p' || true

if docker info 2>/dev/null | grep -q 'runsc'; then
  echo "OK: runsc registered"
  echo "Smoke: docker run --rm --runtime=runsc alpine dmesg | head"
else
  echo "WARN: runsc not listed yet."
  echo "  Docker Desktop + NVIDIA may need a full Quit + Start of Docker Desktop,"
  echo "  then re-run this script. See infra/sandbox/README.md"
  exit 1
fi
