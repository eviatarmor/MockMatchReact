import { z } from "zod"

export const pageDocumentStatusSchema = z.enum([
  "draft",
  "active",
  "archived",
])

export const pageDocumentBodySchema = z.object({
  version: z.literal(1),
  html: z.string().max(2_000_000),
})

export type PageDocumentBodyDto = z.infer<typeof pageDocumentBodySchema>
