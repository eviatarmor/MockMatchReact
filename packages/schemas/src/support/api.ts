import { z } from "zod"

export const helpTopicSchema = z.enum([
  "billing",
  "bug",
  "account",
  "feature",
  "info",
])

export type HelpTopic = z.infer<typeof helpTopicSchema>

export const HELP_TOPICS = helpTopicSchema.options

/** Image screenshot attachments (base64, no data-URL prefix). */
export const supportAttachmentSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
  /** Raw base64 (no `data:...;base64,` prefix). Cap ~2.5MB decoded. */
  dataBase64: z.string().min(1).max(3_500_000),
})

export type SupportAttachment = z.infer<typeof supportAttachmentSchema>

export const submitFeedbackInputSchema = z.object({
  message: z.string().trim().min(10).max(2000),
  path: z.string().max(500).optional(),
  locale: z.string().max(32).optional(),
  attachments: z.array(supportAttachmentSchema).max(3).optional(),
})

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackInputSchema>

export const submitHelpRequestInputSchema = z.object({
  topic: helpTopicSchema,
  subject: z.string().trim().min(1).max(120).optional(),
  message: z.string().trim().min(10).max(4000),
  attachments: z.array(supportAttachmentSchema).max(3).optional(),
})

export type SubmitHelpRequestInput = z.infer<typeof submitHelpRequestInputSchema>

export const supportSubmitResultSchema = z.object({
  ok: z.literal(true),
  ticketKey: z.string().optional(),
})

export type SupportSubmitResult = z.infer<typeof supportSubmitResultSchema>
