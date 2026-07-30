/**
 * @deprecated Prefer `modules/sandbox`. Thin re-exports for compatibility.
 */
export {
  isSandboxEnabled,
} from "../modules/sandbox/service.js"
export {
  sessionHostDir as resolveHostDir,
} from "../modules/sandbox/files.js"
export {
  GUEST_WORKSPACE,
  JAIL_WORKSPACE_MOUNT,
  jailCommand,
} from "../modules/sandbox/docker-util.js"
export {
  safeSessionId,
  sessionUnitName as sessionContainerName,
} from "../modules/sandbox/ids.js"
export { sessionHostDir } from "../modules/sandbox/files.js"

import { sessionHostDir } from "../modules/sandbox/files.js"
import { sessionUnitName } from "../modules/sandbox/ids.js"
import { GUEST_WORKSPACE } from "../modules/sandbox/docker-util.js"
import { getLocalSandboxService } from "../modules/sandbox/service.js"
import { stopAllDockerSandboxes } from "../modules/sandbox/backends/docker-backend.js"

export type SessionSandbox = {
  sessionId: string
  container: string
  hostDir: string
  guestDir: typeof GUEST_WORKSPACE
}

export function resolveSessionPaths(sessionId: string): SessionSandbox {
  return {
    sessionId,
    container: sessionUnitName(sessionId),
    hostDir: sessionHostDir(sessionId),
    guestDir: GUEST_WORKSPACE,
  }
}

export async function ensureSessionSandbox(
  sessionId: string,
  userId = "system"
): Promise<SessionSandbox> {
  await getLocalSandboxService().ensureSession({ sessionId, userId })
  return resolveSessionPaths(sessionId)
}

export async function stopSessionSandbox(sessionId: string): Promise<void> {
  await getLocalSandboxService().destroySession({ sessionId })
}

export async function stopAllSessionSandboxes(): Promise<number> {
  return stopAllDockerSandboxes()
}
