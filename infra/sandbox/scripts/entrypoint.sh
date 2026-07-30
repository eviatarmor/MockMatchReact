#!/usr/bin/env bash
set -euo pipefail

# Per-session sandbox control plane (runs as root with limited caps).
# Builds a chroot jail at /opt/jail so guest code never sees the outer
# container rootfs (/etc debian files, other users' homes, package db, …).
#
# Guest (via jail-run): /workspace only as project root + RO /usr toolchain.

JAIL=/opt/jail
READY=/run/jail-ready

mount_bind_ro() {
  local src=$1
  local dest=$2
  mkdir -p "$dest"
  mount --bind "$src" "$dest"
  mount -o remount,ro,bind "$dest" 2>/dev/null || mount -o remount,bind,ro "$dest"
}

# ── Toolchain (read-only) ─────────────────────────────────────────────
mount_bind_ro /usr "$JAIL/usr"

# ── /dev for jail ─────────────────────────────────────────────────────
# Outer rootfs is RO — stage /dev on tmpfs. Prefer binding the container's
# real ptmx/pts (gVisor). A second "newinstance" devpts often returns
# ENOSPC / "out of pty devices" under runsc.
mount -t tmpfs -o size=2m,mode=755,nosuid tmpfs "$JAIL/dev"
mkdir -p "$JAIL/dev/pts"

mknod -m 666 "$JAIL/dev/null" c 1 3
mknod -m 666 "$JAIL/dev/zero" c 1 5
mknod -m 666 "$JAIL/dev/random" c 1 8
mknod -m 666 "$JAIL/dev/urandom" c 1 9
mknod -m 666 "$JAIL/dev/tty" c 5 0

# Real PTY devices from the container runtime
if [[ -e /dev/ptmx ]]; then
  # Placeholder node, then bind over it
  mknod -m 666 "$JAIL/dev/ptmx" c 5 2 2>/dev/null || : >"$JAIL/dev/ptmx"
  mount --bind /dev/ptmx "$JAIL/dev/ptmx"
else
  mknod -m 666 "$JAIL/dev/ptmx" c 5 2
fi

if [[ -d /dev/pts ]] && mountpoint -q /dev/pts 2>/dev/null || [[ -d /dev/pts ]]; then
  mount --bind /dev/pts "$JAIL/dev/pts"
else
  mount -t devpts -o ptmxmode=0666,mode=0666 devpts "$JAIL/dev/pts"
fi

# ── /proc ─────────────────────────────────────────────────────────────
mount -t proc -o hidepid=2 proc "$JAIL/proc" 2>/dev/null || mount -t proc proc "$JAIL/proc"

# ── Writable areas ────────────────────────────────────────────────────
if [[ -d "$JAIL/workspace" ]]; then
  chown 1000:1000 "$JAIL/workspace" 2>/dev/null || true
  chmod 755 "$JAIL/workspace" 2>/dev/null || true
fi

mount -t tmpfs -o size=64m,mode=1777,noexec,nosuid,nodev tmpfs "$JAIL/tmp"

mkdir -p /run
: >"$READY"
chmod 644 "$READY"

exec sleep infinity
