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
  /**
   * Page cursor for infinite queries (1-based).
   * tRPC `useInfiniteQuery` injects this as `cursor`.
   */
  cursor: z.number().int().min(1).max(50).nullish(),
  pageSize: z.number().int().min(1).max(50).default(15),
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
