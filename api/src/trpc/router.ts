import { accountRouter } from "../modules/account/router.js"
import { authRouter } from "../modules/auth/router.js"
import { billingRouter } from "../modules/billing/router.js"
import { coverLettersRouter } from "../modules/cover-letters/router.js"
import { questionsRouter } from "../modules/questions/router.js"
import { resumesRouter } from "../modules/resumes/router.js"
import { router } from "./trpc.js"

export const appRouter = router({
  auth: authRouter,
  account: accountRouter,
  billing: billingRouter,
  questions: questionsRouter,
  resumes: resumesRouter,
  coverLetters: coverLettersRouter,
})

export type AppRouter = typeof appRouter
