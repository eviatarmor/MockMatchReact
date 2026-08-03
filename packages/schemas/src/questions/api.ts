import { z } from "zod"

export const questionDomainSchema = z.enum([
  "coding",
  "systemDesign",
  "caseStudy",
  "product",
  "behavioral",
  "finance",
  "clinical",
  "dataScience",
  "ml",
  "security",
  "devops",
  "design",
  "consulting",
  "marketing",
  "sales",
])

export const questionDifficultySchema = z.enum(["easy", "medium", "hard"])

export const questionFormatSchema = z.enum([
  "conversation",
  "code_run",
  "workspace",
  "terminal",
  "whiteboard",
  "mcq",
  "spreadsheet",
  "page",
])

export const questionUserStatusSchema = z.enum(["new", "attempted", "mastered"])

export const questionListInputSchema = z
  .object({
    search: z.string().trim().max(200).optional(),
    domains: z.array(questionDomainSchema).max(20).optional(),
    difficulties: z.array(questionDifficultySchema).max(3).optional(),
    formats: z.array(questionFormatSchema).max(8).optional(),
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

/** Spreadsheet practice detail — prompt + optional starter workbook. */
export const questionSpreadsheetDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  format: z.literal("spreadsheet"),
  domain: questionDomainSchema,
  difficulty: questionDifficultySchema,
  company: z.string().nullable(),
  prompt: z.string(),
  rubric: z.string().nullable(),
  durationMin: z.number().int().positive().nullable(),
  starterWorkbook: z
    .object({
      version: z.literal(1),
      activeSheetId: z.string(),
      sheets: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          cells: z.record(z.string(), z.object({ raw: z.string() })),
          rowCount: z.number().int().positive(),
          colCount: z.number().int().positive(),
        })
      ),
    })
    .nullable(),
})

/** Freeform page practice detail — prompt + optional starter HTML. */
export const questionPageDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  format: z.literal("page"),
  domain: questionDomainSchema,
  difficulty: questionDifficultySchema,
  company: z.string().nullable(),
  prompt: z.string(),
  rubric: z.string().nullable(),
  durationMin: z.number().int().positive().nullable(),
  starterHtml: z.string().nullable(),
})

export type QuestionSpreadsheetDetail = z.infer<
  typeof questionSpreadsheetDetailSchema
>
export type QuestionPageDetail = z.infer<typeof questionPageDetailSchema>

export const mcqVariantSchema = z.enum(["single", "multi", "order"])

/** MCQ practice detail — options only; answer revealed via submitMcq. */
export const questionMcqDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  format: z.literal("mcq"),
  domain: questionDomainSchema,
  difficulty: questionDifficultySchema,
  company: z.string().nullable(),
  stem: z.string(),
  options: z.array(z.string()).min(2).max(6),
  /** single | multi | order — default single for legacy rows */
  variant: mcqVariantSchema,
})

export const submitMcqInputSchema = z
  .object({
    id: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        "Invalid question id"
      ),
    /** single */
    selectedIndex: z.number().int().min(0).max(5).optional(),
    /** multi — all chosen option indices */
    selectedIndices: z.array(z.number().int().min(0).max(5)).min(1).max(6).optional(),
    /** order — option indices top→bottom as arranged by user */
    orderedIndices: z.array(z.number().int().min(0).max(5)).min(2).max(6).optional(),
  })
  .superRefine((val, ctx) => {
    const modes = [
      val.selectedIndex !== undefined,
      val.selectedIndices !== undefined,
      val.orderedIndices !== undefined,
    ].filter(Boolean).length
    if (modes !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Provide exactly one of selectedIndex, selectedIndices, or orderedIndices",
      })
    }
  })

export const submitMcqResultSchema = z.object({
  correct: z.boolean(),
  variant: mcqVariantSchema,
  correctIndex: z.number().int().min(0).max(5).nullable(),
  correctIndices: z.array(z.number().int().min(0).max(5)).nullable(),
  correctOrder: z.array(z.number().int().min(0).max(5)).nullable(),
  explanation: z.string().nullable(),
  status: questionUserStatusSchema,
})

/** Same-domain MCQ practice set (seed first). */
export const mcqSessionInputSchema = z.object({
  seedId: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      "Invalid question id"
    ),
  limit: z.number().int().min(1).max(20).default(8),
})

export const mcqSessionSchema = z.object({
  seedId: z.string().uuid(),
  domain: questionDomainSchema,
  questions: z.array(questionMcqDetailSchema).min(1),
})

export type QuestionDomain = z.infer<typeof questionDomainSchema>
export type QuestionDifficulty = z.infer<typeof questionDifficultySchema>
export type QuestionFormat = z.infer<typeof questionFormatSchema>
export type QuestionUserStatus = z.infer<typeof questionUserStatusSchema>
export type BankQuestionDto = z.infer<typeof bankQuestionDtoSchema>
export type QuestionPracticeDetail = z.infer<typeof questionPracticeDetailSchema>
export type McqVariant = z.infer<typeof mcqVariantSchema>
export type QuestionMcqDetail = z.infer<typeof questionMcqDetailSchema>
export type SubmitMcqInput = z.infer<typeof submitMcqInputSchema>
export type SubmitMcqResult = z.infer<typeof submitMcqResultSchema>
export type McqSessionInput = z.infer<typeof mcqSessionInputSchema>
export type McqSession = z.infer<typeof mcqSessionSchema>
export type GenerateFromJobsInput = z.infer<typeof generateFromJobsInputSchema>
