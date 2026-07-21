import { z } from "zod"
import {
  entityIdInputSchema,
  paginatedListInputSchema,
} from "../documents/common.js"
import {
  coverLetterDocumentSchema,
  coverLetterStatusSchema,
  coverLetterTemplateIdSchema,
  documentStyleSchema,
} from "./document.js"

export const coverLetterListInputSchema = paginatedListInputSchema
export const coverLetterIdInputSchema = entityIdInputSchema

export const coverLetterCreateInputSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  company: z.string().trim().max(200).nullable().optional(),
  templateId: coverLetterTemplateIdSchema.optional(),
  style: documentStyleSchema.optional(),
  document: coverLetterDocumentSchema.optional(),
})

export const coverLetterUpdateInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  company: z.string().trim().max(200).nullable().optional(),
  status: coverLetterStatusSchema.optional(),
  templateId: coverLetterTemplateIdSchema.optional(),
  style: documentStyleSchema.optional(),
  document: coverLetterDocumentSchema.optional(),
})

export type CoverLetterListInput = z.infer<typeof coverLetterListInputSchema>
export type CoverLetterCreateInput = z.infer<typeof coverLetterCreateInputSchema>
export type CoverLetterUpdateInput = z.infer<typeof coverLetterUpdateInputSchema>
