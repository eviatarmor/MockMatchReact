import { z } from "zod"

/** File-tree node. Folders have `children`; files are leaves. */
export const ideTreeNodeSchema: z.ZodType<IdeTreeNodeDto> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(512),
    name: z.string().min(1).max(255),
    children: z.array(ideTreeNodeSchema).optional(),
  })
)

export type IdeTreeNodeDto = {
  id: string
  name: string
  children?: IdeTreeNodeDto[]
}

export const ideFileEntrySchema = z.object({
  language: z.string().max(64).optional(),
  content: z.string().max(2_000_000),
})

/** Durable collab document blob for IDE workspaces. */
export const ideWorkspaceDocumentSchema = z.object({
  tree: z.array(ideTreeNodeSchema).max(2_000),
  files: z.record(z.string().min(1).max(512), ideFileEntrySchema),
})

export const ideWorkspaceStatusSchema = z.enum([
  "draft",
  "active",
  "archived",
])

export type IdeFileEntryDto = z.infer<typeof ideFileEntrySchema>
export type IdeWorkspaceDocumentDto = z.infer<typeof ideWorkspaceDocumentSchema>
export type IdeWorkspaceStatus = z.infer<typeof ideWorkspaceStatusSchema>
