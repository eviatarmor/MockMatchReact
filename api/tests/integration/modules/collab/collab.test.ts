import { expect, it } from "vitest"
import {
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"
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
})
