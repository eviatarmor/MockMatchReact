import { z } from "zod"
import { documentKindSchema } from "../collab/api.js"

export const documentVersionSourceSchema = z.enum([
  "create",
  "import",
  "autosave",
  "collab_flush",
  "restore",
])

export const documentVersionsListInputSchema = z.object({
  kind: documentKindSchema,
  id: z.string().uuid(),
})

export const documentVersionGetInputSchema = z.object({
  kind: documentKindSchema,
  id: z.string().uuid(),
  versionId: z.string().uuid(),
})

export const documentVersionRestoreInputSchema = documentVersionGetInputSchema

export type DocumentVersionSource = z.infer<typeof documentVersionSourceSchema>
export type DocumentVersionsListInput = z.infer<
  typeof documentVersionsListInputSchema
>
export type DocumentVersionGetInput = z.infer<
  typeof documentVersionGetInputSchema
>
export type DocumentVersionRestoreInput = z.infer<
  typeof documentVersionRestoreInputSchema
>
