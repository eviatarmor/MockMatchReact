import { TRPCClientError } from "@trpc/client"

export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof TRPCClientError) {
    return error.data?.code === "UNAUTHORIZED"
  }
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { code?: unknown } }).data
    return data?.code === "UNAUTHORIZED"
  }
  return false
}

function getTrpcProcedurePath(error: unknown): string | null {
  if (error instanceof TRPCClientError) {
    const path = error.data?.path
    if (typeof path === "string") return path
  }
  return null
}

/**
 * Procedures that may return UNAUTHORIZED without meaning the session is dead
 * (e.g. wrong OTP on the login form).
 */
const NON_SESSION_UNAUTHORIZED = new Set([
  "auth.verifyOtp",
  "auth.requestOtp",
  "auth.logout",
  "auth.refresh",
])

/** True when UNAUTHORIZED means the browser session should end (or be refreshed). */
export function isSessionUnauthorizedError(error: unknown): boolean {
  if (!isUnauthorizedError(error)) return false

  // Login/signup OTP mistakes are UNAUTHORIZED but not a dead session.
  if (typeof window !== "undefined") {
    const route = window.location.pathname
    if (route === "/login" || route === "/signup") return false
  }

  const path = getTrpcProcedurePath(error)
  if (path && NON_SESSION_UNAUTHORIZED.has(path)) return false
  return true
}
