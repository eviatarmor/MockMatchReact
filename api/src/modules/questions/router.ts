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
  getQuestionForPage,
  getQuestionForPractice,
  getQuestionForSpreadsheet,
  getQuestionSummary,
  listQuestions,
  submitMcqAnswer,
} from "./service.js"

/**
 * Global + self-scoped question bank (read + job-generation).
 * - list / get / forPractice (IDE) / forMcq + submitMcq
 * - forSpreadsheet / forPage practice surfaces
 * - generateFromJobs (also fired auto from trackedJobs.upsert)
 * Custom authoring APIs (createCustom / deploy / listMine / simulationTypes) removed.
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
      return getQuestionSummary(ctx.db, input.id, ctx.user.id)
    }),

  /** Full detail + document for IDE (code_run / workspace / terminal). */
  forPractice: protectedProcedure
    .input(questionIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getQuestionForPractice(ctx.db, input.id, ctx.user.id)
    }),

  /** MCQ stem + options (answer only via submitMcq). */
  forMcq: protectedProcedure
    .input(questionIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getQuestionForMcq(ctx.db, input.id, ctx.user.id)
    }),

  /** Spreadsheet case prompt + optional starter workbook. */
  forSpreadsheet: protectedProcedure
    .input(questionIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getQuestionForSpreadsheet(ctx.db, input.id, ctx.user.id)
    }),

  /** Freeform document analysis prompt + optional starter HTML. */
  forPage: protectedProcedure
    .input(questionIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getQuestionForPage(ctx.db, input.id, ctx.user.id)
    }),

  /** Same-domain MCQ sequence (seed first). */
  forMcqSession: protectedProcedure
    .input(mcqSessionInputSchema)
    .query(async ({ ctx, input }) => {
      return getMcqSession(ctx.db, input.seedId, ctx.user.id, input.limit)
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
