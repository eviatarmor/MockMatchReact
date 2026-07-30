/**
 * Docker backend (one container per session + chroot jail).
 * Optional gVisor via `SANDBOX_RUNTIME=runsc` — this is the isolation boundary
 * for the **docker** backend only. Production multi-tenant prefers Firecracker
 * (separate guest kernel); do not stack gVisor under Firecracker.
 *
 * App pods must NOT use this directly in prod — only sandbox agent/orchestrator.
 */
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { env } from "../../../config/env.js"
import { logger } from "../../../lib/logger.js"
import {
  docker,
  GUEST_WORKSPACE,
  jailCommand,
  JAIL_WORKSPACE_MOUNT,
  LABEL_SESSION,
  LABEL_SESSION_ID,
} from "../docker-util.js"
import { sessionHostDir, syncFilesToHost, wipeSessionHostDir } from "../files.js"
import { nodeId, sessionUnitName } from "../ids.js"
import type {
  BackendEnsureOpts,
  BackendExecOpts,
  BackendPtyOpts,
  SandboxBackend,
} from "./types.js"
import type { SandboxEnsureResult, SandboxExecResult } from "../types.js"

const ensuring = new Map<string, Promise<SandboxEnsureResult>>()
const activeRuns = new Map<string, AbortController>()

type PtyRecord = {
  key: string
  proc: ChildProcessWithoutNullStreams
  sessionId: string
  userId: string
}
const ptys = new Map<string, PtyRecord>()

function ptyKey(sessionId: string, userId: string) {
  return `${sessionId}:${userId}`
}

async function inspectRunning(container: string): Promise<boolean | null> {
  const r = await docker(["inspect", "-f", "{{.State.Running}}", container])
  if (r.code !== 0) return null
  return r.stdout.trim() === "true"
}

async function createContainer(
  sessionId: string,
  unitId: string,
  hostDir: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const image = env.SANDBOX_IMAGE.trim() || "mockmatch-sandbox:local"
  const runtime = env.SANDBOX_RUNTIME.trim()
  const mem = env.SANDBOX_MEM_LIMIT.trim() || "512m"
  const cpus = env.SANDBOX_CPUS.trim() || "1.0"
  const pids = String(env.SANDBOX_PIDS_LIMIT || 256)
  const hostAbs = path.resolve(hostDir)
  const seccomp = env.SANDBOX_SECCOMP_PROFILE.trim()

  const args = [
    "run",
    "-d",
    "--name",
    unitId,
    "--network",
    "none",
    "--read-only",
    "--security-opt",
    "no-new-privileges",
    "--cap-drop",
    "ALL",
    "--cap-add",
    "SYS_ADMIN",
    "--cap-add",
    "SYS_CHROOT",
    "--cap-add",
    "SETUID",
    "--cap-add",
    "SETGID",
    "--cap-add",
    "MKNOD",
    "--memory",
    mem,
    "--memory-swap",
    mem,
    "--cpus",
    cpus,
    "--pids-limit",
    pids,
    "--ulimit",
    "nproc=256",
    "--ulimit",
    "nofile=1024:1024",
    "--ulimit",
    "core=0",
    "--tmpfs",
    "/tmp:size=64m,mode=1777,noexec,nosuid,nodev",
    "--tmpfs",
    "/run:size=8m,mode=755,nosuid,nodev",
    "-u",
    "0:0",
    "-w",
    JAIL_WORKSPACE_MOUNT,
    "-e",
    "HOME=/workspace",
    "-e",
    "TERM=xterm-256color",
    "-e",
    "MOCKMATCH_SANDBOX=1",
    "-e",
    `MOCKMATCH_SESSION=${sessionUnitName(sessionId)}`,
    "-v",
    `${hostAbs}:${JAIL_WORKSPACE_MOUNT}`,
    "--label",
    LABEL_SESSION,
    "--label",
    `${LABEL_SESSION_ID}=${sessionUnitName(sessionId)}`,
    "--label",
    "mockmatch.sandbox.backend=docker",
    "--restart",
    "no",
  ]

  if (seccomp) {
    args.push("--security-opt", `seccomp=${seccomp}`)
  }
  if (runtime) {
    args.push("--runtime", runtime)
  }
  args.push(image)

  const r = await docker(args, 120_000)
  if (r.code !== 0) {
    const err = (r.stderr || r.stdout || "docker run failed").trim()
    if (/already in use/i.test(err)) {
      const running = await inspectRunning(unitId)
      if (running === true) return { ok: true }
      if (running === false) {
        const start = await docker(["start", unitId])
        if (start.code === 0) return { ok: true }
      }
    }
    return {
      ok: false,
      error: `Failed to create sandbox: ${err}. npm run sandbox:up?`,
    }
  }
  return { ok: true }
}

export class DockerSandboxBackend implements SandboxBackend {
  readonly name = "docker" as const

  async ensure(opts: BackendEnsureOpts): Promise<SandboxEnsureResult> {
    if (!env.SANDBOX_CONTAINER_PREFIX.trim()) {
      throw new Error("Sandbox disabled (SANDBOX_CONTAINER_PREFIX empty).")
    }
    const existing = ensuring.get(opts.sessionId)
    if (existing) return existing

    const p = this.doEnsure(opts).finally(() => ensuring.delete(opts.sessionId))
    ensuring.set(opts.sessionId, p)
    return p
  }

  private async doEnsure(
    opts: BackendEnsureOpts
  ): Promise<SandboxEnsureResult> {
    const unitId = sessionUnitName(opts.sessionId)
    const hostDir = sessionHostDir(opts.sessionId)
    await mkdir(hostDir, { recursive: true })

    const running = await inspectRunning(unitId)
    if (running === true) {
      return {
        sessionId: opts.sessionId,
        unitId,
        backend: "docker",
        guestDir: GUEST_WORKSPACE,
      }
    }
    if (running === false) {
      const start = await docker(["start", unitId])
      if (start.code === 0) {
        return {
          sessionId: opts.sessionId,
          unitId,
          backend: "docker",
          guestDir: GUEST_WORKSPACE,
        }
      }
      await docker(["rm", "-f", unitId])
    }

    const created = await createContainer(opts.sessionId, unitId, hostDir)
    if (!created.ok) throw new Error(created.error)
    logger.info(
      { sessionId: opts.sessionId, unitId, nodeId: nodeId() },
      "docker sandbox ensured"
    )
    return {
      sessionId: opts.sessionId,
      unitId,
      backend: "docker",
      guestDir: GUEST_WORKSPACE,
    }
  }

  async destroy(sessionId: string): Promise<void> {
    this.closeAllPty(sessionId)
    this.abortExec(sessionId)
    const unitId = sessionUnitName(sessionId)
    await docker(["rm", "-f", unitId])
    if (env.SANDBOX_WIPE_HOST_DIR_ON_DESTROY) {
      await wipeSessionHostDir(sessionId)
    }
  }

  isExecActive(sessionId: string): boolean {
    return activeRuns.has(sessionId)
  }

  abortExec(sessionId: string): void {
    const c = activeRuns.get(sessionId)
    if (c) {
      c.abort()
      activeRuns.delete(sessionId)
    }
  }

  async exec(opts: BackendExecOpts): Promise<SandboxExecResult> {
    if (activeRuns.has(opts.sessionId)) {
      return {
        runId: opts.runId,
        exitCode: null,
        error: "A sandbox run is already in progress for this workspace.",
        command: "",
      }
    }
    await syncFilesToHost(opts.sessionId, opts.files)
    const session = await this.ensure({
      sessionId: opts.sessionId,
      userId: opts.userId,
    })

    const ac = new AbortController()
    activeRuns.set(opts.sessionId, ac)
    const onAbort = () => {
      // killed in child handler
    }
    opts.signal.addEventListener("abort", onAbort)
    ac.signal.addEventListener("abort", onAbort)

    try {
      await opts.handlers.onStart?.({
        runId: opts.runId,
        command: opts.label,
      })
      const exitCode = await new Promise<number | null>((resolve) => {
        const child = spawn(
          "docker",
          ["exec", session.unitId, ...jailCommand(opts.argv)],
          { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }
        )
        const kill = () => {
          try {
            child.kill("SIGKILL")
          } catch {
            // ignore
          }
        }
        const timer = setTimeout(() => {
          opts.handlers.onStderr(
            `\n[sandbox] timed out after ${opts.timeoutMs / 1000}s\n`
          )
          kill()
        }, opts.timeoutMs)
        ac.signal.addEventListener("abort", () => {
          opts.handlers.onStderr("\n[sandbox] aborted\n")
          kill()
        })
        opts.signal.addEventListener("abort", () => {
          opts.handlers.onStderr("\n[sandbox] aborted\n")
          kill()
        })
        child.stdout?.on("data", (b: Buffer) =>
          opts.handlers.onStdout(b.toString("utf8"))
        )
        child.stderr?.on("data", (b: Buffer) =>
          opts.handlers.onStderr(b.toString("utf8"))
        )
        child.on("error", (err) => {
          clearTimeout(timer)
          opts.handlers.onStderr(
            `\n[sandbox] docker failed: ${err.message}\n`
          )
          resolve(null)
        })
        child.on("close", (code) => {
          clearTimeout(timer)
          resolve(code)
        })
      })
      return {
        runId: opts.runId,
        exitCode,
        command: opts.label,
        error:
          exitCode === null
            ? "Sandbox process failed (unit not running?)"
            : undefined,
      }
    } finally {
      activeRuns.delete(opts.sessionId)
    }
  }

  async openPty(
    opts: BackendPtyOpts
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    this.closePty(opts.sessionId, opts.userId)
    let unitId: string
    try {
      if (opts.files && Object.keys(opts.files).length > 0) {
        await syncFilesToHost(opts.sessionId, opts.files)
      } else {
        await mkdir(sessionHostDir(opts.sessionId), { recursive: true })
      }
      const session = await this.ensure({
        sessionId: opts.sessionId,
        userId: opts.userId,
      })
      unitId = session.unitId
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }

    const cols = opts.cols
    const rows = opts.rows
    const py = `
import os, pty, sys, select, errno
cols, rows = ${cols}, ${rows}
os.environ["TERM"] = "xterm-256color"
os.environ["COLUMNS"] = str(cols)
os.environ["LINES"] = str(rows)
JAIL = "/opt/jail"
ENV = {
  "HOME": "/workspace", "USER": "coder", "LOGNAME": "coder",
  "TERM": "xterm-256color", "COLUMNS": str(cols), "LINES": str(rows),
  "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
  "LANG": "C.UTF-8", "MOCKMATCH_SANDBOX": "1", "MOCKMATCH_JAIL": "1",
}
pid, master = pty.fork()
if pid == 0:
  try:
    os.chroot(JAIL)
    os.chdir("/workspace")
    os.setgroups([])
    os.setgid(1000)
    os.setuid(1000)
    os.execve("/bin/bash", ["bash", "-l"], ENV)
  except Exception as e:
    sys.stderr.write(f"jail shell failed: {e}\\n")
    os._exit(127)
  os._exit(127)
stdin, stdout = sys.stdin.buffer, sys.stdout.buffer
try:
  while True:
    try:
      r, _, _ = select.select([master, stdin], [], [])
    except (ValueError, OSError):
      break
    if master in r:
      try:
        data = os.read(master, 8192)
      except OSError as e:
        if e.errno != errno.EIO: raise
        break
      if not data: break
      stdout.write(data); stdout.flush()
    if stdin in r:
      data = stdin.read1(8192) if hasattr(stdin, "read1") else os.read(stdin.fileno(), 8192)
      if not data:
        wpid, _ = os.waitpid(pid, os.WNOHANG)
        if wpid != 0: break
        continue
      os.write(master, data)
except KeyboardInterrupt:
  pass
finally:
  try: os.close(master)
  except OSError: pass
  try:
    _, status = os.waitpid(pid, 0)
  except ChildProcessError:
    status = 0
  if hasattr(os, "waitstatus_to_exitcode"):
    raise SystemExit(os.waitstatus_to_exitcode(status))
  raise SystemExit(0 if status == 0 else 1)
`.trim()

    const proc = spawn(
      "docker",
      [
        "exec",
        "-i",
        "-e",
        "TERM=xterm-256color",
        unitId,
        "python3",
        "-u",
        "-c",
        py,
      ],
      { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }
    ) as ChildProcessWithoutNullStreams

    const key = ptyKey(opts.sessionId, opts.userId)
    const rec: PtyRecord = {
      key,
      proc,
      sessionId: opts.sessionId,
      userId: opts.userId,
    }
    ptys.set(key, rec)
    const onChunk = (buf: Buffer) => {
      if (!ptys.has(key)) return
      opts.handlers.onData(buf.toString("utf8"))
    }
    proc.stdout.on("data", onChunk)
    proc.stderr.on("data", onChunk)
    proc.on("error", (err) => {
      ptys.delete(key)
      opts.handlers.onError(`Sandbox shell failed: ${err.message}`)
      opts.handlers.onExit(null)
    })
    proc.on("close", (code) => {
      if (ptys.get(key) === rec) ptys.delete(key)
      opts.handlers.onExit(code)
    })
    return { ok: true }
  }

  writePty(sessionId: string, userId: string, data: string): boolean {
    const rec = ptys.get(ptyKey(sessionId, userId))
    if (!rec?.proc.stdin.writable) return false
    try {
      rec.proc.stdin.write(data)
      return true
    } catch {
      return false
    }
  }

  closePty(sessionId: string, userId: string): void {
    const key = ptyKey(sessionId, userId)
    const rec = ptys.get(key)
    if (!rec) return
    ptys.delete(key)
    try {
      rec.proc.stdin.end()
    } catch {
      // ignore
    }
    try {
      rec.proc.kill("SIGKILL")
    } catch {
      // ignore
    }
  }

  closeAllPty(sessionId: string): void {
    for (const [k, rec] of [...ptys]) {
      if (rec.sessionId === sessionId) {
        this.closePty(sessionId, rec.userId)
        void k
      }
    }
  }
}

export async function stopAllDockerSandboxes(): Promise<number> {
  const list = await docker([
    "ps",
    "-aq",
    "--filter",
    `label=${LABEL_SESSION}`,
  ])
  if (list.code !== 0) return 0
  const ids = list.stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (ids.length === 0) return 0
  await docker(["rm", "-f", ...ids])
  return ids.length
}
