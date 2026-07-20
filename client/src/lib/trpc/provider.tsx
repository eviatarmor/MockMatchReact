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
          // credentials: "include" when cookie-based refresh lands
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
