import {
  fitCoverLetterInputSchema,
  fitResumeInputSchema,
  jobSearchInputSchema,
  scoreFitsInputSchema,
  summarizeJobsInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import { fitCoverLetterToJob } from "./fit-doc/fit-cover-letter.js"
import { fitResumeToJob } from "./fit-doc/fit-resume.js"
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

  /**
   * Tailor a new draft resume to a job (capable-cheap model).
   * Charges resumeScans credits after successful generation.
   */
  fitResume: protectedProcedure
    .input(fitResumeInputSchema)
    .mutation(async ({ ctx, input }) => {
      return fitResumeToJob(ctx.db, ctx.user.id, input)
    }),

  /**
   * Tailor a new draft cover letter to a job.
   * Charges coverLetters credits after successful generation.
   */
  fitCoverLetter: protectedProcedure
    .input(fitCoverLetterInputSchema)
    .mutation(async ({ ctx, input }) => {
      return fitCoverLetterToJob(ctx.db, ctx.user.id, input)
    }),
})
