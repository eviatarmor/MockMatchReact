import { z } from "zod"

export const documentKindSchema = z.enum(["resume", "cover_letter"])
export const collabRoleSchema = z.enum(["view", "edit"])
/** Effective room role including owner (never stored on collaborator rows). */
export const collabEffectiveRoleSchema = z.enum(["view", "edit", "owner"])

export const collabPermissionsSchema = z.object({
  canEditContent: z.boolean(),
  canEditDesign: z.boolean(),
  canUseAi: z.boolean(),
  canShare: z.boolean(),
  canExport: z.boolean(),
})

export const collabDocInputSchema = z.object({
  kind: documentKindSchema,
  id: z.string().uuid(),
})

export const createShareLinkInputSchema = collabDocInputSchema.extend({
  role: collabRoleSchema.default("edit"),
})

export const revokeShareLinkInputSchema = z.object({
  shareId: z.string().uuid(),
})

export const listCollaboratorsInputSchema = collabDocInputSchema

export const updateCollaboratorRoleInputSchema = collabDocInputSchema.extend({
  userId: z.string().uuid(),
  role: collabRoleSchema,
})

export const removeCollaboratorInputSchema = collabDocInputSchema.extend({
  userId: z.string().uuid(),
})

export const wsTicketInputSchema = collabDocInputSchema.extend({
  /** Raw share token from ?share= — only needed on first join via link. */
  shareToken: z.string().min(16).max(128).optional(),
})

export const getAccessInputSchema = collabDocInputSchema.extend({
  shareToken: z.string().min(16).max(128).optional(),
})

export const grantDevCreditsInputSchema = z.object({
  amount: z.number().int().positive().max(10_000).default(100),
})

export type DocumentKind = z.infer<typeof documentKindSchema>
export type CollabRole = z.infer<typeof collabRoleSchema>
export type CollabEffectiveRole = z.infer<typeof collabEffectiveRoleSchema>
export type CollabPermissions = z.infer<typeof collabPermissionsSchema>
