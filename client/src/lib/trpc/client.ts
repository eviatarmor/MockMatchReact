import { createTRPCReact } from "@trpc/react-query"
import type { AppRouter } from "@mockmatch/api/router"

export const trpc = createTRPCReact<AppRouter>()
