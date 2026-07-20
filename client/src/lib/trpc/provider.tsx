import { useState, type ReactNode } from "react"
import { httpBatchLink } from "@trpc/client"
import type { QueryClient } from "@tanstack/react-query"
import { trpc } from "./client"

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:3000"
}

export function TrpcProvider({
  queryClient,
  children,
}: {
  queryClient: QueryClient
  children: ReactNode
}) {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getApiBaseUrl()}/trpc`,
          // Send HttpOnly auth cookies on every request (cross-origin localhost OK with CORS credentials).
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            })
          },
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  )
}
