import { z } from "zod"
import {
  entityIdInputSchema,
  paginatedListInputSchema,
} from "../documents/common.js"
import {
  ideWorkspaceDocumentSchema,
  ideWorkspaceStatusSchema,
} from "./document.js"

export const ideWorkspaceListInputSchema = paginatedListInputSchema
export const ideWorkspaceIdInputSchema = entityIdInputSchema

export const ideWorkspaceCreateInputSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  document: ideWorkspaceDocumentSchema.optional(),
})

export const ideWorkspaceUpdateInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  status: ideWorkspaceStatusSchema.optional(),
  document: ideWorkspaceDocumentSchema.optional(),
})

export type IdeWorkspaceListInput = z.infer<typeof ideWorkspaceListInputSchema>
export type IdeWorkspaceCreateInput = z.infer<
  typeof ideWorkspaceCreateInputSchema
>
export type IdeWorkspaceUpdateInput = z.infer<
  typeof ideWorkspaceUpdateInputSchema
>
