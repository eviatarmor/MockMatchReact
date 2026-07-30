/**
 * Firecracker / microVM backend.
 *
 * Isolation boundary = guest kernel (Firecracker). **No gVisor** on this path —
 * stacking runsc under a microVM is redundant and not used.
 *
 * Production: agent launches Firecracker VMs (`infra/sandbox/agent`).
 * Dev escape hatch only: `SANDBOX_FIRECRACKER_FALLBACK_DOCKER=true` switches to
 * the Docker backend (then gVisor may apply). Prefer `SANDBOX_BACKEND=docker`
 * explicitly for local instead of fallback.
 *
 * Requires Linux + KVM + firecracker + rootfs/kernel images.
 */
import { spawn } from "node:child_process"
import { access } from "node:fs/promises"
import { env } from "../../../config/env.js"
import { logger } from "../../../lib/logger.js"
import { DockerSandboxBackend } from "./docker-backend.js"
import type {
  BackendEnsureOpts,
  BackendExecOpts,
  BackendPtyOpts,
  SandboxBackend,
} from "./types.js"
import type { SandboxEnsureResult, SandboxExecResult } from "../types.js"
import { sessionUnitName } from "../ids.js"
import { sessionHostDir, wipeSessionHostDir } from "../files.js"
import {
  defaultFirecrackerBinPath,
  ensureFirecrackerLatest,
} from "../firecracker-install.js"

async function resolveFirecrackerBin(): Promise<string> {
  if (env.SANDBOX_FIRECRACKER_AUTO_UPDATE) {
    const r = await ensureFirecrackerLatest()
    if (!r.ok) {
      logger.warn({ err: r.error }, "firecracker auto-update failed")
    } else if (r.version) {
      logger.info({ version: r.version }, "firecracker ready (latest)")
    }
  }
  return defaultFirecrackerBinPath()
}

async function firecrackerAvailable(): Promise<boolean> {
  const bin = await resolveFirecrackerBin()
  try {
    await access(bin)
    return true
  } catch {
    // try PATH name
  }
  return new Promise((resolve) => {
    const child = spawn(bin, ["--version"], {
      windowsHide: true,
      stdio: "ignore",
    })
    child.on("error", () => resolve(false))
    child.on("close", (code) => resolve(code === 0))
  })
}

/**
 * Real Firecracker driver (Linux agent). Boots a microVM via helper script.
 * If the helper is missing, throws with install guidance.
 */
class NativeFirecrackerBackend implements SandboxBackend {
  readonly name = "firecracker" as const
  private dockerFallback = new DockerSandboxBackend()
  private usingFallback = false

  private async resolve(): Promise<SandboxBackend> {
    if (await firecrackerAvailable()) {
      // Native path still routes through agent helper script when present.
      // Full FC wiring lives in infra/sandbox/agent/run-firecracker.sh
      const helper = env.SANDBOX_FIRECRACKER_HELPER.trim()
      if (helper) {
        return this
      }
    }
    if (env.SANDBOX_FIRECRACKER_FALLBACK_DOCKER) {
      this.usingFallback = true
      logger.warn(
        "Firecracker binary/helper unavailable — using Docker fallback (dev only)"
      )
      return this.dockerFallback
    }
    throw new Error(
      "Firecracker backend unavailable. Install Firecracker on sandbox nodes " +
        "or set SANDBOX_FIRECRACKER_FALLBACK_DOCKER=1 for local dev."
    )
  }

  async ensure(opts: BackendEnsureOpts): Promise<SandboxEnsureResult> {
    const backend = await this.resolve()
    if (backend !== this) return backend.ensure(opts)

    // Native: invoke helper create
    const helper = env.SANDBOX_FIRECRACKER_HELPER.trim()
    const unitId = sessionUnitName(opts.sessionId)
    const hostDir = sessionHostDir(opts.sessionId)
    const result = await runHelper(helper, [
      "create",
      "--session",
      opts.sessionId,
      "--unit",
      unitId,
      "--workspace",
      hostDir,
    ])
    if (result.code !== 0) {
      throw new Error(
        result.stderr || result.stdout || "firecracker create failed"
      )
    }
    return {
      sessionId: opts.sessionId,
      unitId,
      backend: "firecracker",
      guestDir: "/workspace",
    }
  }

  async destroy(sessionId: string): Promise<void> {
    if (this.usingFallback) {
      await this.dockerFallback.destroy(sessionId)
      return
    }
    const helper = env.SANDBOX_FIRECRACKER_HELPER.trim()
    if (!helper) {
      await this.dockerFallback.destroy(sessionId)
      return
    }
    await runHelper(helper, ["destroy", "--session", sessionId])
    if (env.SANDBOX_WIPE_HOST_DIR_ON_DESTROY) {
      await wipeSessionHostDir(sessionId)
    }
  }

  isExecActive(sessionId: string): boolean {
    if (this.usingFallback) return this.dockerFallback.isExecActive(sessionId)
    return this.dockerFallback.isExecActive(sessionId)
  }

  abortExec(sessionId: string): void {
    this.dockerFallback.abortExec(sessionId)
  }

  async exec(opts: BackendExecOpts): Promise<SandboxExecResult> {
    const backend = await this.resolve()
    if (backend !== this) return backend.exec(opts)
    // Helper exec: stream not fully wired — fall back to docker-compat only when
    // native helper implements exec over vsock later.
    const helper = env.SANDBOX_FIRECRACKER_HELPER.trim()
    if (!helper) return this.dockerFallback.exec(opts)
    await this.ensure({ sessionId: opts.sessionId, userId: opts.userId })
    // Prefer helper; if it only supports lifecycle, docker fallback for exec
    // is incorrect for true FC — helper must implement exec.
    const r = await runHelper(helper, [
      "exec",
      "--session",
      opts.sessionId,
      "--",
      ...opts.argv,
    ])
    await opts.handlers.onStart?.({
      runId: opts.runId,
      command: opts.label,
    })
    if (r.stdout) opts.handlers.onStdout(r.stdout)
    if (r.stderr) opts.handlers.onStderr(r.stderr)
    return {
      runId: opts.runId,
      exitCode: r.code,
      command: opts.label,
      error: r.code === null ? "firecracker exec failed" : undefined,
    }
  }

  async openPty(opts: BackendPtyOpts) {
    const backend = await this.resolve()
    if (backend !== this) return backend.openPty(opts)
    // PTY over vsock not implemented in helper yet → docker fallback only if allowed
    if (env.SANDBOX_FIRECRACKER_FALLBACK_DOCKER) {
      return this.dockerFallback.openPty(opts)
    }
    return {
      ok: false as const,
      error:
        "Firecracker PTY requires agent vsock support (helper) or FALLBACK_DOCKER",
    }
  }

  writePty(sessionId: string, userId: string, data: string): boolean {
    return this.dockerFallback.writePty(sessionId, userId, data)
  }

  closePty(sessionId: string, userId: string): void {
    this.dockerFallback.closePty(sessionId, userId)
  }

  closeAllPty(sessionId: string): void {
    this.dockerFallback.closeAllPty(sessionId)
  }
}

function runHelper(
  helper: string,
  args: string[]
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(helper, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    child.stdout?.on("data", (b: Buffer) => {
      stdout += b.toString("utf8")
    })
    child.stderr?.on("data", (b: Buffer) => {
      stderr += b.toString("utf8")
    })
    child.on("error", (err) =>
      resolve({ code: null, stdout, stderr: err.message })
    )
    child.on("close", (code) => resolve({ code, stdout, stderr }))
  })
}

export function createFirecrackerBackend(): SandboxBackend {
  return new NativeFirecrackerBackend()
}
