import { accountRouter } from "../modules/account/router.js"
import { authRouter } from "../modules/auth/router.js"
import { billingRouter } from "../modules/billing/router.js"
import { collabRouter } from "../modules/collab/router.js"
import { coverLettersRouter } from "../modules/cover-letters/router.js"
import { documentVersionsRouter } from "../modules/document-versions/router.js"
import { ideWorkspacesRouter } from "../modules/ide-workspaces/router.js"
import { jobsRouter } from "../modules/jobs/router.js"
import { practiceExercisesRouter } from "../modules/practice-exercises/router.js"
import { practiceSessionsRouter } from "../modules/practice-sessions/router.js"
import { questionsRouter } from "../modules/questions/router.js"
import { resumesRouter } from "../modules/resumes/router.js"
import { supportRouter } from "../modules/support/router.js"
import { trackedJobsRouter } from "../modules/tracked-jobs/router.js"
import { voiceRouter } from "../modules/voice/router.js"
import { whiteboardRouter } from "../modules/whiteboard/router.js"
import { router } from "./trpc.js"

export const appRouter = router({
  auth: authRouter,
  account: accountRouter,
  billing: billingRouter,
  collab: collabRouter,
  documentVersions: documentVersionsRouter,
  questions: questionsRouter,
  resumes: resumesRouter,
  coverLetters: coverLettersRouter,
  ideWorkspaces: ideWorkspacesRouter,
  practiceExercises: practiceExercisesRouter,
  practiceSessions: practiceSessionsRouter,
  jobs: jobsRouter,
  support: supportRouter,
  trackedJobs: trackedJobsRouter,
  voice: voiceRouter,
  whiteboard: whiteboardRouter,
})

export type AppRouter = typeof appRouter
