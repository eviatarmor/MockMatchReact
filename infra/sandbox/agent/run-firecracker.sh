#!/usr/bin/env bash
# Firecracker lifecycle helper (Linux sandbox nodes + KVM).
# Invoked by Firecracker backend when SANDBOX_FIRECRACKER_HELPER points here.
#
# Usage:
#   run-firecracker.sh create  --session ID --unit NAME --workspace DIR
#   run-firecracker.sh destroy --session ID
#   run-firecracker.sh exec    --session ID -- cmd args...
#
# Requires: firecracker, jailer (optional), rootfs + kernel images.
# See docs/sandbox-isolation.md

set -euo pipefail

CMD="${1:-}"
shift || true

SESSION=""
UNIT=""
WORKSPACE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --session) SESSION="$2"; shift 2 ;;
    --unit) UNIT="$2"; shift 2 ;;
    --workspace) WORKSPACE="$2"; shift 2 ;;
    --) shift; break ;;
    *) break ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_FC="$SCRIPT_DIR/bin/firecracker"
FC_BIN="${SANDBOX_FIRECRACKER_BIN:-$DEFAULT_FC}"
KERNEL="${SANDBOX_FC_KERNEL:-/opt/mockmatch/fc/vmlinux}"
ROOTFS="${SANDBOX_FC_ROOTFS:-/opt/mockmatch/fc/rootfs.ext4}"
RUN_ROOT="${SANDBOX_FC_RUN_ROOT:-/var/lib/mockmatch/fc}"

# Prefer auto-updated binary under agent/bin
if [[ ! -x "$FC_BIN" && -x "$DEFAULT_FC" ]]; then
  FC_BIN="$DEFAULT_FC"
fi
if [[ ! -x "$FC_BIN" ]] && ! command -v firecracker >/dev/null 2>&1; then
  echo "firecracker binary not found. Run: npm run sandbox:install-firecracker" >&2
  exit 127
fi
if [[ ! -x "$FC_BIN" ]]; then
  FC_BIN="$(command -v firecracker)"
fi

case "$CMD" in
  create)
    [[ -n "$SESSION" && -n "$UNIT" && -n "$WORKSPACE" ]] || {
      echo "create requires --session --unit --workspace" >&2
      exit 2
    }
    DIR="$RUN_ROOT/$SESSION"
    mkdir -p "$DIR"
    # Placeholder: real integration copies rootfs, sets up tap/vsock, boots FC.
    # Until fully wired, emit config skeleton for ops to complete.
    cat >"$DIR/config.json" <<EOF
{
  "session": "$SESSION",
  "unit": "$UNIT",
  "workspace": "$WORKSPACE",
  "kernel": "$KERNEL",
  "rootfs": "$ROOTFS",
  "boot-source": { "kernel_image_path": "$KERNEL", "boot_args": "console=ttyS0 reboot=k panic=1 pci=off" },
  "drives": [],
  "machine-config": { "vcpu_count": 1, "mem_size_mib": 512 }
}
EOF
    echo "created skeleton at $DIR (complete FC boot wiring for full microVM)"
    # For gradual rollout: if FALLBACK not set, still exit 0 after skeleton
    # so orchestrator can track registry; exec/pty need vsock agent next.
    ;;
  destroy)
    [[ -n "$SESSION" ]] || { echo "destroy requires --session" >&2; exit 2; }
    rm -rf "$RUN_ROOT/$SESSION"
    echo "destroyed $SESSION"
    ;;
  exec)
    echo "Firecracker exec over vsock not yet implemented; use agent docker fallback or complete vsock guest agent" >&2
    exit 3
    ;;
  *)
    echo "usage: $0 create|destroy|exec ..." >&2
    exit 2
    ;;
esac
