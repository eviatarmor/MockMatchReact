import { z } from "zod"

export const trackingStatusSchema = z.enum([
  "saved",
  "applied",
  "interviewing",
  "offer",
  "declined",
])

export const matchTierSchema = z.enum(["strong", "good", "fair", "weak"])

export const seniorityLevelSchema = z.enum([
  "senior",
  "lead",
  "staff",
  "unknown",
])

export const trackedJobDtoSchema = z.object({
  id: z.string().uuid(),
  sourceKey: z.string().min(1),
  provider: z.string(),
  externalId: z.string().nullable(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  description: z.string().nullable(),
  applyUrl: z.string().nullable(),
  status: trackingStatusSchema,
  salaryRange: z.string(),
  seniority: seniorityLevelSchema,
  matchScore: z.number(),
  matchTier: matchTierSchema,
  avatarText: z.string(),
  avatarColorClass: z.string(),
  postedAt: z.string(),
  nextStepDate: z.string().nullable(),
  questionsGeneratedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const trackedJobListInputSchema = z
  .object({
    status: trackingStatusSchema.optional(),
  })
  .optional()

export const trackedJobUpsertInputSchema = z.object({
  sourceKey: z.string().trim().min(1).max(256),
  provider: z.string().trim().min(1).max(64).default("manual"),
  externalId: z.string().trim().max(256).nullable().optional(),
  title: z.string().trim().min(1).max(300),
  company: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200).default("—"),
  description: z.string().max(50_000).nullable().optional(),
  applyUrl: z.string().max(2000).nullable().optional(),
  status: trackingStatusSchema.default("saved"),
  salaryRange: z.string().max(120).default("—"),
  seniority: seniorityLevelSchema.default("unknown"),
  matchScore: z.number().min(0).max(100).default(0),
  matchTier: matchTierSchema.default("weak"),
  avatarText: z.string().max(8).default("?"),
  avatarColorClass: z.string().max(120).default(""),
  postedAt: z.string().max(80).default(""),
  nextStepDate: z.string().max(80).nullable().optional(),
  /**
   * When true (Discover apply / Import job), kick off question bank generation
   * if this job has not been generated yet.
   */
  generateQuestions: z.boolean().optional().default(false),
})

export const trackedJobUpsertResultSchema = z.object({
  job: trackedJobDtoSchema,
  /** Auto-gen outcome for this upsert. */
  questionGen: z.enum(["started", "skipped_already", "skipped_no_flag", "skipped_no_key"]),
})


export const trackedJobUpdateStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: trackingStatusSchema,
})

export const trackedJobReplaceStatusesInputSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().uuid(),
        status: trackingStatusSchema,
      })
    )
    .min(1)
    .max(100),
})

export const trackedJobRemoveInputSchema = z.object({
  id: z.string().uuid(),
})

export const trackedJobRemoveBySourceKeyInputSchema = z.object({
  sourceKey: z.string().trim().min(1).max(256),
})

export const trackedJobImportLocalInputSchema = z.object({
  jobs: z.array(trackedJobUpsertInputSchema).max(200),
})

export type TrackingStatus = z.infer<typeof trackingStatusSchema>
export type TrackedJobDto = z.infer<typeof trackedJobDtoSchema>
export type TrackedJobUpsertInput = z.infer<typeof trackedJobUpsertInputSchema>
