import {
  generateFromJobsInputSchema,
  questionIdInputSchema,
  questionListInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import { generateQuestionsFromJobs } from "./generate.js"
import {
  getQuestionForPractice,
  getQuestionSummary,
  listQuestions,
} from "./service.js"

/**
 * Global question bank.
 * - list / get / forPractice (IDE)
 * - generateFromJobs (also fired auto from trackedJobs.upsert)
 */
export const questionsRouter = router({
  list: protectedProcedure
    .input(questionListInputSchema)
    .query(async ({ ctx, input }) => {
      return listQuestions(ctx.db, ctx.user.id, input ?? {})
    }),

  /** Lightweight row (conversation open by question id in URL). */
  get: protectedProcedure
    .input(questionIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getQuestionSummary(ctx.db, input.id)
    }),

  /** Full detail + document for IDE (code_run / workspace / terminal). */
  forPractice: protectedProcedure
    .input(questionIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getQuestionForPractice(ctx.db, input.id)
    }),

  generateFromJobs: protectedProcedure
    .input(generateFromJobsInputSchema)
    .mutation(async ({ ctx, input }) => {
      return generateQuestionsFromJobs(
        ctx.db,
        ctx.user.id,
        input.trackedJobIds
      )
    }),
})
