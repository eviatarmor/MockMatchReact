import { createTRPCClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "@mockmatch/api/router"

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:3000"
}

/** Imperative tRPC client (logout / refresh outside React components). */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getApiBaseUrl()}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        })
      },
    }),
  ],
})
