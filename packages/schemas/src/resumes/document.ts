import { z } from "zod"
import {
  contactEntrySchema,
  contactIconKeySchema,
  documentStatusSchema,
  documentStyleSchema,
} from "../documents/common.js"

/** @deprecated Prefer contactIconKeySchema — re-export for resume callers. */
export const resumeContactIconKeySchema = contactIconKeySchema
export const resumeContactEntrySchema = contactEntrySchema
export { documentStyleSchema, documentStatusSchema }

export const resumeHeaderSchema = z.object({
  name: z.string(),
  headline: z.string(),
  contacts: z.array(contactEntrySchema),
})

export const bulletItemSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
})

export const sectionEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  org: z.string(),
  location: z.string(),
  url: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.string(),
})

export const languageItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  proficiency: z.string(),
})

export const referenceItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  relation: z.string(),
  contact: z.string(),
})

const sectionBase = { id: z.string().min(1) }

export const resumeSectionSchema = z.discriminatedUnion("type", [
  z.object({ ...sectionBase, type: z.literal("summary"), text: z.string() }),
  z.object({
    ...sectionBase,
    type: z.literal("experience"),
    entries: z.array(sectionEntrySchema),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("education"),
    entries: z.array(sectionEntrySchema),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("skills"),
    items: z.array(bulletItemSchema),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("projects"),
    entries: z.array(sectionEntrySchema),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("volunteering"),
    entries: z.array(sectionEntrySchema),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("awards"),
    title: z.string(),
    issuer: z.string(),
    date: z.string(),
    description: z.string(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("certifications"),
    name: z.string(),
    issuer: z.string(),
    date: z.string(),
    credentialId: z.string(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("publications"),
    title: z.string(),
    publisher: z.string(),
    date: z.string(),
    url: z.string(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("languages"),
    items: z.array(languageItemSchema),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("affiliations"),
    organization: z.string(),
    role: z.string(),
    date: z.string(),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("hobbies"),
    items: z.array(bulletItemSchema),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("references"),
    items: z.array(referenceItemSchema),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("custom"),
    heading: z.string(),
    text: z.string(),
  }),
])

export const resumeDocumentSchema = z.object({
  header: resumeHeaderSchema,
  sections: z.array(resumeSectionSchema),
})

export const resumeTemplateIdSchema = z.enum([
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

export const resumeStatusSchema = documentStatusSchema

export type ResumeDocumentDto = z.infer<typeof resumeDocumentSchema>
export type ResumeStatus = z.infer<typeof resumeStatusSchema>
export type ResumeTemplateId = z.infer<typeof resumeTemplateIdSchema>
export type ResumeContactIconKey = z.infer<typeof contactIconKeySchema>
