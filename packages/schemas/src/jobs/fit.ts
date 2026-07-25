import { z } from "zod"

export const fitSkillTagSchema = z.object({
  label: z.string().min(1).max(80),
  /**
   * Optional residual field — UI shows job-required skills only.
   * Kept for older clients / caches that still send it.
   */
  matched: z.boolean().optional().default(false),
})

export const fitTierSchema = z.enum(["strong", "good", "fair", "weak"])

export const fitModeSchema = z.enum(["heuristic", "ai", "none"])

export const fitScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  tier: fitTierSchema,
  fitNote: z.string().max(200),
  skills: z.array(fitSkillTagSchema).max(8),
  mode: z.enum(["heuristic", "ai"]),
})

export const jobFitStubSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().max(300),
  company: z.string().max(200),
  description: z.string().max(2000),
  category: z.string().max(120).nullable().optional(),
  location: z.string().max(200).optional(),
})

export const scoreFitsInputSchema = z.object({
  jobs: z.array(jobFitStubSchema).min(1).max(20),
  /** Prefer AI when user has credits; free always heuristic. */
  preferAi: z.boolean().default(true),
})

export const scoreFitsResultSchema = z.object({
  resumeCount: z.number().int().nonnegative(),
  profileHash: z.string().nullable(),
  mode: fitModeSchema,
  scores: z.record(z.string(), fitScoreSchema),
  creditsCharged: z.number().int().nonnegative(),
  creditsRemaining: z.number().int().nonnegative(),
})

/** Batch job summaries for Discover cards (free OpenRouter model). */
export const jobSummaryStubSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().max(300),
  company: z.string().max(200),
  description: z.string().max(2000),
  category: z.string().max(120).nullable().optional(),
  location: z.string().max(200).optional(),
})

export const summarizeJobsInputSchema = z.object({
  jobs: z.array(jobSummaryStubSchema).min(1).max(20),
})

export const summarizeJobsResultSchema = z.object({
  /** jobId → short plain-language summary */
  summaries: z.record(z.string(), z.string().max(400)),
  mode: z.enum(["ai", "heuristic", "none"]),
})

export type FitSkillTag = z.infer<typeof fitSkillTagSchema>
export type FitTier = z.infer<typeof fitTierSchema>
export type FitMode = z.infer<typeof fitModeSchema>
export type FitScore = z.infer<typeof fitScoreSchema>
export type JobFitStub = z.infer<typeof jobFitStubSchema>
export type ScoreFitsInput = z.infer<typeof scoreFitsInputSchema>
export type ScoreFitsResult = z.infer<typeof scoreFitsResultSchema>
export type JobSummaryStub = z.infer<typeof jobSummaryStubSchema>
export type SummarizeJobsInput = z.infer<typeof summarizeJobsInputSchema>
export type SummarizeJobsResult = z.infer<typeof summarizeJobsResultSchema>
