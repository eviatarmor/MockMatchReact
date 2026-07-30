import { env } from "../../config/env.js"

export function safeSessionId(sessionId: string): string {
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "session"
}

export function sessionUnitName(sessionId: string): string {
  const safeId = safeSessionId(sessionId)
  const rawPrefix = env.SANDBOX_CONTAINER_PREFIX.trim() || "mm-sbx"
  const prefix = rawPrefix
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .replace(/^-+/, "")
    .slice(0, 20)
  return `${prefix}-${safeId}`.slice(0, 63)
}

export function nodeId(): string {
  return env.SANDBOX_NODE_ID || "local"
}
