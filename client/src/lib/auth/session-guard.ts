import type { QueryClient } from "@tanstack/react-query"
import { trpcClient } from "@/lib/trpc/vanilla"
import { clearUser } from "./session"

let logoutInFlight: Promise<void> | null = null
let recoveryInFlight: Promise<void> | null = null

function isPublicAuthRoute(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup"
}

/**
 * Clear local user, revoke refresh cookie server-side, wipe query cache, go to login.
 */
export async function forceLogout(queryClient: QueryClient): Promise<void> {
  if (logoutInFlight) return logoutInFlight

  logoutInFlight = (async () => {
    clearUser()
    try {
      await trpcClient.auth.logout.mutate()
    } catch {
      // Cookie may already be missing/invalid — still finish local cleanup.
    }
    queryClient.clear()

    const { pathname, search } = window.location
    if (isPublicAuthRoute(pathname)) return

    const next = `${pathname}${search}`
    window.location.assign(`/login?next=${encodeURIComponent(next)}`)
  })().finally(() => {
    logoutInFlight = null
  })

  return logoutInFlight
}

/**
 * UNAUTHORIZED from a protected call: try refresh once; if that fails, full logout.
 */
export async function handleUnauthorized(queryClient: QueryClient): Promise<void> {
  if (logoutInFlight) return logoutInFlight
  if (recoveryInFlight) return recoveryInFlight

  recoveryInFlight = (async () => {
    try {
      await trpcClient.auth.refresh.mutate()
      await queryClient.invalidateQueries()
    } catch {
      await forceLogout(queryClient)
    }
  })().finally(() => {
    recoveryInFlight = null
  })

  return recoveryInFlight
}
