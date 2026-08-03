import { z } from "zod"
import { entityIdInputSchema } from "../documents/common.js"
import {
  pageDocumentBodySchema,
  pageDocumentStatusSchema,
} from "./document.js"

export const pageDocumentIdInputSchema = entityIdInputSchema

export const pageDocumentCreateInputSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  questionId: z.string().uuid().optional(),
  document: pageDocumentBodySchema.optional(),
})

export const pageDocumentUpdateInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  status: pageDocumentStatusSchema.optional(),
  document: pageDocumentBodySchema.optional(),
})

export const pageDocumentDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: pageDocumentStatusSchema,
  questionId: z.string().uuid().nullable(),
  document: pageDocumentBodySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type PageDocumentCreateInput = z.infer<
  typeof pageDocumentCreateInputSchema
>
export type PageDocumentUpdateInput = z.infer<
  typeof pageDocumentUpdateInputSchema
>
