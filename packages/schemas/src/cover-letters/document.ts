import { z } from "zod"
import {
  contactEntrySchema,
  documentStatusSchema,
  documentStyleSchema,
} from "../documents/common.js"

export { documentStyleSchema, documentStatusSchema }

export const letterSenderSchema = z.object({
  name: z.string(),
  title: z.string(),
  contacts: z.array(contactEntrySchema),
})

export const letterRecipientSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  company: z.string(),
  addressLines: z.array(z.string()).optional(),
})

const blockBase = { id: z.string().min(1) }

export const letterBlockSchema = z.discriminatedUnion("type", [
  z.object({ ...blockBase, type: z.literal("greeting"), text: z.string() }),
  z.object({ ...blockBase, type: z.literal("paragraph"), text: z.string() }),
  z.object({ ...blockBase, type: z.literal("subject"), text: z.string() }),
  z.object({
    ...blockBase,
    type: z.literal("signoff"),
    closing: z.string(),
    signature: z.string(),
  }),
  z.object({
    ...blockBase,
    type: z.literal("custom"),
    heading: z.string(),
    text: z.string(),
  }),
])

export const coverLetterDocumentSchema = z.object({
  sender: letterSenderSchema,
  date: z.string(),
  recipient: letterRecipientSchema,
  blocks: z.array(letterBlockSchema),
})

export const coverLetterTemplateIdSchema = z.enum([
  "modern",
  "classic",
  "minimal",
  "technical",
  "executive",
  "compact",
  "banner",
  "editorial",
  "elegant",
])

export const coverLetterStatusSchema = documentStatusSchema

export type CoverLetterDocumentDto = z.infer<typeof coverLetterDocumentSchema>
export type CoverLetterTemplateId = z.infer<typeof coverLetterTemplateIdSchema>
export type CoverLetterStatus = z.infer<typeof coverLetterStatusSchema>
