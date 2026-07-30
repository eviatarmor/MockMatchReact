import { env } from "../../../config/env.js"
import type { SandboxBackend } from "./types.js"
import { DockerSandboxBackend } from "./docker-backend.js"
import { createFirecrackerBackend } from "./firecracker-backend.js"
import { MockSandboxBackend } from "./mock-backend.js"
import type { SandboxBackendName } from "../types.js"

let cached: SandboxBackend | null = null

export function createSandboxBackend(
  name?: SandboxBackendName
): SandboxBackend {
  const backend = name ?? env.SANDBOX_BACKEND
  switch (backend) {
    case "mock":
      return new MockSandboxBackend()
    case "firecracker":
      return createFirecrackerBackend()
    case "docker":
    default:
      return new DockerSandboxBackend()
  }
}

/** Process-local backend (agent / in-process orchestrator). */
export function getLocalSandboxBackend(): SandboxBackend {
  if (!cached) cached = createSandboxBackend()
  return cached
}

export type { SandboxBackend } from "./types.js"
