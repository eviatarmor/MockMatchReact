import { spawn } from "node:child_process"

export type DockerResult = {
  code: number | null
  stdout: string
  stderr: string
}

export function docker(
  args: string[],
  timeoutMs = 60_000
): Promise<DockerResult> {
  return new Promise((resolve) => {
    const child = spawn("docker", args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
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
        code: null,
        stdout,
        stderr: stderr || `docker timed out after ${timeoutMs}ms`,
      })
    }, timeoutMs)

    child.stdout?.on("data", (buf: Buffer) => {
      stdout += buf.toString("utf8")
    })
    child.stderr?.on("data", (buf: Buffer) => {
      stderr += buf.toString("utf8")
    })
    child.on("error", (err) => {
      clearTimeout(timer)
      resolve({ code: null, stdout, stderr: err.message })
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      resolve({ code, stdout, stderr })
    })
  })
}

export function jailCommand(argv: string[]): string[] {
  return ["jail-run", "--", ...argv]
}

export const GUEST_WORKSPACE = "/workspace" as const
export const JAIL_WORKSPACE_MOUNT = "/opt/jail/workspace"
export const LABEL_SESSION = "mockmatch.sandbox=session"
export const LABEL_SESSION_ID = "mockmatch.session"
