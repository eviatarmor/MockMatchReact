import { describe, expect, it } from "vitest"
import {
  collabDocInputSchema,
  collabEffectiveRoleSchema,
  collabPermissionsSchema,
  collabRoleSchema,
  createShareLinkInputSchema,
  documentKindSchema,
  getAccessInputSchema,
  grantDevCreditsInputSchema,
  removeCollaboratorInputSchema,
  revokeShareLinkInputSchema,
  updateCollaboratorRoleInputSchema,
  wsTicketInputSchema,
} from "@/collab/api.js"

const UUID = "550e8400-e29b-41d4-a716-446655440000"
const TOKEN = "a".repeat(16)

describe("documentKindSchema", () => {
  it("accepts known kinds", () => {
    for (const k of ["resume", "cover_letter", "workspace", "whiteboard"] as const) {
      expect(documentKindSchema.parse(k)).toBe(k)
    }
    expect(() => documentKindSchema.parse("pdf")).toThrow()
  })
})

describe("collab roles", () => {
  it("role is view|edit; effective adds owner", () => {
    expect(collabRoleSchema.parse("view")).toBe("view")
    expect(collabRoleSchema.parse("edit")).toBe("edit")
    expect(() => collabRoleSchema.parse("owner")).toThrow()
    expect(collabEffectiveRoleSchema.parse("owner")).toBe("owner")
  })
})

describe("collabPermissionsSchema", () => {
  it("requires all booleans", () => {
    const p = collabPermissionsSchema.parse({
      canEditContent: true,
      canEditDesign: false,
      canUseAi: false,
      canShare: true,
      canExport: true,
    })
    expect(p.canEditContent).toBe(true)
    expect(() =>
      collabPermissionsSchema.parse({ canEditContent: true })
    ).toThrow()
  })
})

describe("collabDocInputSchema", () => {
  it("needs kind + uuid", () => {
    expect(
      collabDocInputSchema.parse({ kind: "resume", id: UUID })
    ).toEqual({ kind: "resume", id: UUID })
    expect(() =>
      collabDocInputSchema.parse({ kind: "resume", id: "x" })
    ).toThrow()
  })
})

describe("createShareLinkInputSchema", () => {
  it("defaults role to edit", () => {
    const v = createShareLinkInputSchema.parse({ kind: "workspace", id: UUID })
    expect(v.role).toBe("edit")
  })

  it("accepts view", () => {
    expect(
      createShareLinkInputSchema.parse({
        kind: "whiteboard",
        id: UUID,
        role: "view",
      }).role
    ).toBe("view")
  })
})

describe("revokeShareLinkInputSchema", () => {
  it("requires shareId uuid", () => {
    expect(revokeShareLinkInputSchema.parse({ shareId: UUID }).shareId).toBe(
      UUID
    )
    expect(() =>
      revokeShareLinkInputSchema.parse({ shareId: "nope" })
    ).toThrow()
  })
})

describe("update/remove collaborator", () => {
  it("updateCollaboratorRoleInputSchema", () => {
    const v = updateCollaboratorRoleInputSchema.parse({
      kind: "cover_letter",
      id: UUID,
      userId: UUID,
      role: "view",
    })
    expect(v.role).toBe("view")
  })

  it("removeCollaboratorInputSchema", () => {
    const v = removeCollaboratorInputSchema.parse({
      kind: "resume",
      id: UUID,
      userId: UUID,
    })
    expect(v.userId).toBe(UUID)
  })
})

describe("wsTicket / getAccess", () => {
  it("shareToken optional but length-bounded", () => {
    expect(
      wsTicketInputSchema.parse({ kind: "resume", id: UUID }).shareToken
    ).toBeUndefined()

    expect(
      wsTicketInputSchema.parse({
        kind: "resume",
        id: UUID,
        shareToken: TOKEN,
      }).shareToken
    ).toBe(TOKEN)

    expect(() =>
      wsTicketInputSchema.parse({
        kind: "resume",
        id: UUID,
        shareToken: "short",
      })
    ).toThrow()

    expect(() =>
      getAccessInputSchema.parse({
        kind: "resume",
        id: UUID,
        shareToken: "x".repeat(129),
      })
    ).toThrow()
  })
})

describe("grantDevCreditsInputSchema", () => {
  it("defaults amount 100; positive int max 10000", () => {
    expect(grantDevCreditsInputSchema.parse({}).amount).toBe(100)
    expect(grantDevCreditsInputSchema.parse({ amount: 50 }).amount).toBe(50)
    expect(() => grantDevCreditsInputSchema.parse({ amount: 0 })).toThrow()
    expect(() => grantDevCreditsInputSchema.parse({ amount: 10_001 })).toThrow()
    expect(() => grantDevCreditsInputSchema.parse({ amount: 1.5 })).toThrow()
  })
})
