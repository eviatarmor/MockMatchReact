import {
  jobSearchInputSchema,
  scoreFitsInputSchema,
  summarizeJobsInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import { scoreJobFits } from "./fit/score.js"
import { searchJobs } from "./service.js"
import { summarizeJobs } from "./summarize.js"

export const jobsRouter = router({
  search: protectedProcedure
    .input(jobSearchInputSchema)
    .query(async ({ ctx, input }) => {
      return searchJobs(ctx.db, ctx.user.id, input)
    }),

  /** Multi-resume fit. Free = heuristic; paid credits = optional AI. */
  scoreFits: protectedProcedure
    .input(scoreFitsInputSchema)
    .mutation(async ({ ctx, input }) => {
      return scoreJobFits(ctx.db, ctx.user.id, input)
    }),

  /** Short card summaries via free OpenRouter model (Redis-cached). */
  summarize: protectedProcedure
    .input(summarizeJobsInputSchema)
    .mutation(async ({ input }) => {
      return summarizeJobs(input)
    }),
})
