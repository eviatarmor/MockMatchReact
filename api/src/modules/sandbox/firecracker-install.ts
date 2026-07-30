/**
 * Ensure Firecracker binary is the latest GitHub release (auto-update).
 * Invokes infra/sandbox/scripts/install-firecracker.mjs
 */
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { access, readFile } from "node:fs/promises"
import { env } from "../../config/env.js"
import { logger } from "../../lib/logger.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../"
)

export function firecrackerBinDir(): string {
  return path.join(repoRoot, "infra/sandbox/agent/bin")
}

/** Default installed binary path (auto-update target). */
export function defaultFirecrackerBinPath(): string {
  const fromEnv = env.SANDBOX_FIRECRACKER_BIN.trim()
  if (fromEnv && fromEnv !== "firecracker") return fromEnv
  return path.join(firecrackerBinDir(), "firecracker")
}

export async function readInstalledFirecrackerVersion(): Promise<string | null> {
  try {
    const v = await readFile(path.join(firecrackerBinDir(), "VERSION"), "utf8")
    return v.trim()
  } catch {
    return null
  }
}

/**
 * Run install script: always pulls GitHub **latest** if newer or missing.
 * @returns version string (e.g. v1.16.1) when known
 */
export function ensureFirecrackerLatest(opts?: {
  force?: boolean
  timeoutMs?: number
}): Promise<{ ok: boolean; version: string | null; error?: string }> {
  if (!env.SANDBOX_FIRECRACKER_AUTO_UPDATE && !opts?.force) {
    return readInstalledFirecrackerVersion().then((version) => ({
      ok: true,
      version,
    }))
  }

  const script = path.join(
    repoRoot,
    "infra/sandbox/scripts/install-firecracker.mjs"
  )
  const args = [script]
  if (opts?.force) args.push("--force")

  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: repoRoot,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    })
    let stdout = ""
    let stderr = ""
    const timer = setTimeout(() => {
      try {
        child.kill("SIGKILL")
      } catch {
        // ignore
      }
      resolve({
        ok: false,
        version: null,
        error: "firecracker install timed out",
      })
    }, opts?.timeoutMs ?? 180_000)

    child.stdout?.on("data", (b: Buffer) => {
      stdout += b.toString("utf8")
    })
    child.stderr?.on("data", (b: Buffer) => {
      stderr += b.toString("utf8")
    })
    child.on("error", (err) => {
      clearTimeout(timer)
      resolve({ ok: false, version: null, error: err.message })
    })
    child.on("close", async (code) => {
      clearTimeout(timer)
      if (stdout.trim()) logger.info({ stdout: stdout.trim() }, "firecracker install")
      if (code !== 0) {
        resolve({
          ok: false,
          version: null,
          error: stderr.trim() || stdout.trim() || `exit ${code}`,
        })
        return
      }
      const version = await readInstalledFirecrackerVersion()
      resolve({ ok: true, version })
    })
  })
}

export async function firecrackerBinaryExists(): Promise<boolean> {
  const bin = defaultFirecrackerBinPath()
  try {
    await access(bin)
    return true
  } catch {
    return false
  }
}
