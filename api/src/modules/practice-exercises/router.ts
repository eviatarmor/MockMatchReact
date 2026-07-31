import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  getPracticeExerciseBySlug,
  listPracticeExercises,
  seedPracticeExercises,
} from "./service.js"
import { env } from "../../config/env.js"

export const practiceExercisesRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          format: z.enum(["code_run", "workspace", "terminal"]).optional(),
          domain: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return listPracticeExercises(ctx.db, input)
    }),

  bySlug: protectedProcedure
    .input(z.object({ slug: z.string().min(1).max(64) }))
    .query(async ({ ctx, input }) => {
      return getPracticeExerciseBySlug(ctx.db, input.slug)
    }),

  /**
   * Dev helper: re-seed catalog (+ S3 upload when bucket configured).
   * Blocked in production.
   */
  seed: protectedProcedure.mutation(async ({ ctx }) => {
    if (env.NODE_ENV === "production") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Exercise seed is disabled in production",
      })
    }
    return seedPracticeExercises(ctx.db, { uploadS3: true })
  }),
})
