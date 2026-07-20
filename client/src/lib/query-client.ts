import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { isSessionUnauthorizedError, isUnauthorizedError } from "@/lib/auth/errors"
import { handleUnauthorized } from "@/lib/auth/session-guard"

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isSessionUnauthorizedError(error)) {
        void handleUnauthorized(queryClient)
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isSessionUnauthorizedError(error)) {
        void handleUnauthorized(queryClient)
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isUnauthorizedError(error)) return false
        return failureCount < 1
      },
    },
  },
})
