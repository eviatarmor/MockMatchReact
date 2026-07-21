import { z } from "zod"
import {
  entityIdInputSchema,
  paginatedListInputSchema,
} from "../documents/common.js"
import {
  documentStyleSchema,
  resumeDocumentSchema,
  resumeStatusSchema,
  resumeTemplateIdSchema,
} from "./document.js"

export const resumeListInputSchema = paginatedListInputSchema
export const resumeIdInputSchema = entityIdInputSchema

export const resumeCreateInputSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  targetRole: z.string().trim().max(200).nullable().optional(),
  company: z.string().trim().max(200).nullable().optional(),
  templateId: resumeTemplateIdSchema.optional(),
  style: documentStyleSchema.optional(),
  document: resumeDocumentSchema.optional(),
})

export const resumeUpdateInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  targetRole: z.string().trim().max(200).nullable().optional(),
  company: z.string().trim().max(200).nullable().optional(),
  status: resumeStatusSchema.optional(),
  templateId: resumeTemplateIdSchema.optional(),
  style: documentStyleSchema.optional(),
  document: resumeDocumentSchema.optional(),
})

export type ResumeListInput = z.infer<typeof resumeListInputSchema>
export type ResumeCreateInput = z.infer<typeof resumeCreateInputSchema>
export type ResumeUpdateInput = z.infer<typeof resumeUpdateInputSchema>
