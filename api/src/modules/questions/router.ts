import {
  generateFromJobsInputSchema,
  mcqSessionInputSchema,
  questionIdInputSchema,
  questionListInputSchema,
  submitMcqInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import { generateQuestionsFromJobs } from "./generate.js"
import {
  getMcqSession,
  getQuestionForMcq,
  getQuestionForPractice,
  getQuestionSummary,
  listQuestions,
  submitMcqAnswer,
} from "./service.js"

/**
 * Global question bank.
 * - list / get / forPractice (IDE) / forMcq + submitMcq
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

  /** MCQ stem + options (answer only via submitMcq). */
  forMcq: protectedProcedure
    .input(questionIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getQuestionForMcq(ctx.db, input.id)
    }),

  /** Same-domain MCQ sequence (seed first). */
  forMcqSession: protectedProcedure
    .input(mcqSessionInputSchema)
    .query(async ({ ctx, input }) => {
      return getMcqSession(ctx.db, input.seedId, input.limit)
    }),

  /** Grade selection + update user progress. */
  submitMcq: protectedProcedure
    .input(submitMcqInputSchema)
    .mutation(async ({ ctx, input }) => {
      return submitMcqAnswer(ctx.db, ctx.user.id, input.id, {
        selectedIndex: input.selectedIndex,
        selectedIndices: input.selectedIndices,
        orderedIndices: input.orderedIndices,
      })
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
