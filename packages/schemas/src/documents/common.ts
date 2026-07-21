import { z } from "zod"

/** Shared visual style axes for resume + cover letter editors. */
export const documentStyleSchema = z.object({
  accent: z.enum([
    "blue",
    "teal",
    "indigo",
    "emerald",
    "amber",
    "rose",
    "purple",
    "slate",
  ]),
  typeface: z.enum(["geist", "source-serif", "newsreader", "mono"]),
  heading: z.enum(["accent", "underline", "small-caps", "plain"]),
  density: z.enum(["compact", "normal", "relaxed"]),
})

export const documentStatusSchema = z.enum(["draft", "active", "archived"])

/** Contact icon keys — client resolves to Lucide at render. */
export const contactIconKeySchema = z.enum([
  "mail",
  "phone",
  "mapPin",
  "globe",
  "link",
])

export const contactEntrySchema = z.object({
  id: z.string().min(1),
  iconKey: contactIconKeySchema,
  value: z.string(),
})

export const paginatedListInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(200).optional(),
})

export const entityIdInputSchema = z.object({
  id: z.string().uuid(),
})

export type DocumentStyleDto = z.infer<typeof documentStyleSchema>
export type DocumentStatus = z.infer<typeof documentStatusSchema>
export type ContactIconKey = z.infer<typeof contactIconKeySchema>
export type PaginatedListInput = z.infer<typeof paginatedListInputSchema>
