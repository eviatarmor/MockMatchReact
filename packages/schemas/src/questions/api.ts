import { z } from "zod"

export const questionDomainSchema = z.enum([
  "coding",
  "systemDesign",
  "caseStudy",
  "product",
  "behavioral",
  "finance",
  "clinical",
])

export const questionDifficultySchema = z.enum(["easy", "medium", "hard"])

export const questionFormatSchema = z.enum([
  "conversation",
  "code_run",
  "workspace",
  "terminal",
  "whiteboard",
  "mcq",
])

export const questionUserStatusSchema = z.enum(["new", "attempted", "mastered"])

export const questionListInputSchema = z
  .object({
    search: z.string().trim().max(200).optional(),
    domains: z.array(questionDomainSchema).max(10).optional(),
    difficulties: z.array(questionDifficultySchema).max(3).optional(),
    formats: z.array(questionFormatSchema).max(6).optional(),
    userStatuses: z.array(questionUserStatusSchema).max(3).optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(50),
  })
  .optional()

export const bankQuestionDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  domain: questionDomainSchema,
  difficulty: questionDifficultySchema,
  company: z.string().nullable(),
  format: questionFormatSchema,
  language: z.string().nullable(),
  status: questionUserStatusSchema,
  body: z.string().nullable().optional(),
  /** conversation → voice track hint */
  trackHint: z.string().nullable().optional(),
})

/** Loose UUID (zod uuid() can reject some valid ids depending on version). */
export const questionIdInputSchema = z.object({
  id: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      "Invalid question id"
    ),
})

/** Lightweight row for conversation open (track resolved server-side). */
export const questionSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  format: questionFormatSchema,
  domain: questionDomainSchema,
  difficulty: questionDifficultySchema,
  body: z.string().nullable(),
  trackHint: z.string().nullable(),
  /** Safe conversation track id for voice UI (catalog only). */
  conversationTrackId: z
    .enum(["behavioral-core", "product-sense", "system-design-talk"])
    .nullable(),
})

/** Full bank item for IDE / practice (source of truth). */
export const questionPracticeDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  format: questionFormatSchema,
  domain: questionDomainSchema,
  difficulty: questionDifficultySchema,
  language: z.string().nullable(),
  body: z.string().nullable(),
  prompt: z.string(),
  trackHint: z.string().nullable().optional(),
  trackId: z.string(),
  document: z.object({
    tree: z.array(z.any()),
    files: z.record(
      z.string(),
      z.object({
        content: z.string(),
        language: z.string().optional(),
      })
    ),
  }),
  uiFlags: z.object({
    treeEnabled: z.boolean(),
    defaultShowTree: z.boolean(),
    defaultShowTerminal: z.boolean(),
    openSeedTabs: z.boolean(),
    tabsClosable: z.boolean(),
    tests: z
      .array(
        z.object({
          name: z.string(),
          stdin: z.string().optional(),
          expectedStdout: z.string().optional(),
        })
      )
      .optional(),
    entryPath: z.string().optional(),
    runtimeLanguage: z.string().optional(),
  }),
})

export const generateFromJobsInputSchema = z.object({
  trackedJobIds: z.array(z.string().uuid()).min(1).max(5),
})

export type QuestionDomain = z.infer<typeof questionDomainSchema>
export type QuestionDifficulty = z.infer<typeof questionDifficultySchema>
export type QuestionFormat = z.infer<typeof questionFormatSchema>
export type QuestionUserStatus = z.infer<typeof questionUserStatusSchema>
export type BankQuestionDto = z.infer<typeof bankQuestionDtoSchema>
export type QuestionPracticeDetail = z.infer<typeof questionPracticeDetailSchema>
export type GenerateFromJobsInput = z.infer<typeof generateFromJobsInputSchema>
