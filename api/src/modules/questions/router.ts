import {
  createCustomQuestionInputSchema,
  deployQuestionInputSchema,
  generateFromJobsInputSchema,
  listMineQuestionsInputSchema,
  mcqSessionInputSchema,
  questionIdInputSchema,
  questionListInputSchema,
  submitMcqInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  createCustomQuestion,
  deployQuestion,
  listMineQuestions,
  listSimulationTypes,
} from "./custom.js"
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
 * Global + self-scoped question bank.
 * - list / get / forPractice (IDE) / forMcq + submitMcq
 * - forSpreadsheet / forPage practice surfaces
 * - generateFromJobs (also fired auto from trackedJobs.upsert)
 * - createCustom + deploy (self-only) + listMine + simulationTypes
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

  /**
   * Create a self-owned custom question (draft, visibility=self).
   * Not visible in the shared bank until `deploy` with scope self.
   */
  createCustom: protectedProcedure
    .input(createCustomQuestionInputSchema)
    .mutation(async ({ ctx, input }) => {
      return createCustomQuestion(ctx.db, ctx.user.id, input)
    }),

  /**
   * Deploy a custom question into the caller's personal bank.
   * Only `scope: "self"` is allowed — team/global are rejected.
   */
  deploy: protectedProcedure
    .input(deployQuestionInputSchema)
    .mutation(async ({ ctx, input }) => {
      return deployQuestion(ctx.db, ctx.user.id, input)
    }),

  /** Caller's custom drafts + self-deployed rows (not global bank). */
  listMine: protectedProcedure
    .input(listMineQuestionsInputSchema)
    .query(async ({ ctx, input }) => {
      return listMineQuestions(ctx.db, ctx.user.id, input ?? undefined)
    }),

  /** Static catalog of simulation formats for create UI / sidebar. */
  simulationTypes: protectedProcedure.query(() => {
    return listSimulationTypes()
  }),
})
