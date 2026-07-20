import { authRouter } from "../modules/auth/router.js"
import { questionsRouter } from "../modules/questions/router.js"
import { router } from "./trpc.js"

export const appRouter = router({
  auth: authRouter,
  questions: questionsRouter,
})

export type AppRouter = typeof appRouter
