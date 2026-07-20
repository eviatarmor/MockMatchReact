import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { isUnauthorizedError } from "@/lib/auth/errors"
import { setUser } from "@/lib/auth/session"
import { forceLogout, handleUnauthorized } from "@/lib/auth/session-guard"
import { trpc } from "@/lib/trpc"

/**
 * Protects dashboard routes: validates HttpOnly session via auth.me.
 * Missing/invalid session → refresh attempt or logout + redirect to /login.
 */
export function RequireAuth() {
  const queryClient = useQueryClient()
  const me = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (me.data) setUser(me.data)
  }, [me.data])

  useEffect(() => {
    if (!me.isError || !me.error) return

    if (isUnauthorizedError(me.error)) {
      void handleUnauthorized(queryClient)
      return
    }

    // Non-auth failure while loading the session — treat as logged out.
    void forceLogout(queryClient)
  }, [me.isError, me.error, queryClient])

  if (me.isLoading) {
    return <div className="h-svh w-full bg-sidebar" aria-busy="true" />
  }

  if (me.isError || !me.data) {
    return <div className="h-svh w-full bg-sidebar" aria-busy="true" />
  }

  return <Outlet />
}
