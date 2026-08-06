import { expect, it } from "vitest"
import {
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

describeIntegration("collab (integration)", () => {
  it("getAccess owner on cover letter; share flow after dev credits", async () => {
    const caller = await signupAuthedCaller()
    const doc = await caller.coverLetters.create({ title: "Shared CL" })

    const accessFree = await caller.collab.getAccess({
      kind: "cover_letter",
      id: doc.id,
    })
    expect(accessFree.role).toBe("owner")
    expect(accessFree.ownerUserId).toBeTruthy()
    expect(accessFree.permissions.canEditContent).toBe(true)
    // Free users cannot share
    expect(accessFree.canShare).toBe(false)

    const collabs = await caller.collab.listCollaborators({
      kind: "cover_letter",
      id: doc.id,
    })
    expect(Array.isArray(collabs.items)).toBe(true)

    const linksBefore = await caller.collab.listShareLinks({
      kind: "cover_letter",
      id: doc.id,
    })
    expect(Array.isArray(linksBefore.items)).toBe(true)
    expect(linksBefore.items).toHaveLength(0)

    // grantDevCredits is non-production only (NODE_ENV=test)
    const bal = await caller.collab.grantDevCredits({ amount: 50 })
    expect(bal.remaining).toBeGreaterThan(0)

    const accessPaid = await caller.collab.getAccess({
      kind: "cover_letter",
      id: doc.id,
    })
    expect(accessPaid.canShare).toBe(true)
    expect(accessPaid.isPaidOwner).toBe(true)

    const share = await caller.collab.createShareLink({
      kind: "cover_letter",
      id: doc.id,
      role: "view",
    })
    expect(share.shareId).toBeTruthy()
    expect(share.token).toBeTruthy()
    expect(share.url).toContain("share=")
    expect(share.role).toBe("view")

    const links = await caller.collab.listShareLinks({
      kind: "cover_letter",
      id: doc.id,
    })
    expect(links.items.some((l) => l.id === share.shareId)).toBe(true)

    const revoked = await caller.collab.revokeShareLink({
      shareId: share.shareId,
    })
    expect(revoked.ok).toBe(true)

    const linksAfter = await caller.collab.listShareLinks({
      kind: "cover_letter",
      id: doc.id,
    })
    expect(linksAfter.items.some((l) => l.id === share.shareId)).toBe(false)

    await caller.coverLetters.delete({ id: doc.id })
  })

  it("createShareLink forbidden without credits", async () => {
    const caller = await signupAuthedCaller()
    const doc = await caller.coverLetters.create({ title: "No Share" })

    await expect(
      caller.collab.createShareLink({
        kind: "cover_letter",
        id: doc.id,
        role: "edit",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" })

    await caller.coverLetters.delete({ id: doc.id })
  })

  it("resolveShare: invalid / revoked / wrong kind", async () => {
    const caller = await signupAuthedCaller()
    const board = await caller.whiteboard.create({ title: "Share board" })
    await caller.collab.grantDevCredits({ amount: 50 })

    const share = await caller.collab.createShareLink({
      kind: "whiteboard",
      id: board.id,
      role: "edit",
    })

    const resolved = await caller.collab.resolveShare({
      shareToken: share.token,
      kind: "whiteboard",
    })
    expect(resolved.kind).toBe("whiteboard")
    expect(resolved.documentId).toBe(board.id)

    await expect(
      caller.collab.resolveShare({
        shareToken: share.token,
        kind: "spreadsheet",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" })

    await expect(
      caller.collab.resolveShare({
        shareToken: "x".repeat(32),
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" })

    await caller.collab.revokeShareLink({ shareId: share.shareId })
    await expect(
      caller.collab.resolveShare({
        shareToken: share.token,
        kind: "whiteboard",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" })

    await caller.whiteboard.delete({ id: board.id })
  })
})
