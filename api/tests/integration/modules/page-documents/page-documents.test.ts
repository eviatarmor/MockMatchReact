import { expect, it } from "vitest"
import {
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"

describeIntegration("pageDocuments (integration)", () => {
  it("create → get → update → delete", async () => {
    const caller = await signupAuthedCaller()

    const created = await caller.pageDocuments.create({
      title: "Analysis",
      document: { version: 1, html: "<h1>Hello</h1><p>Body</p>" },
    })
    expect(created.id).toBeTruthy()
    expect(created.title).toBe("Analysis")
    expect(created.document.html).toContain("Hello")

    const one = await caller.pageDocuments.get({ id: created.id })
    expect(one.id).toBe(created.id)

    const updated = await caller.pageDocuments.update({
      id: created.id,
      title: "Analysis v2",
      document: { version: 1, html: "<h1>Updated</h1>" },
    })
    expect(updated.title).toBe("Analysis v2")
    expect(updated.document.html).toContain("Updated")

    await caller.pageDocuments.delete({ id: created.id })
    await expect(
      caller.pageDocuments.get({ id: created.id })
    ).rejects.toBeTruthy()
  })

  it("collab getAccess owner on page", async () => {
    const caller = await signupAuthedCaller()
    const created = await caller.pageDocuments.create({ title: "Share page" })
    const access = await caller.collab.getAccess({
      kind: "page",
      id: created.id,
    })
    expect(access.role).toBe("owner")
    await caller.pageDocuments.delete({ id: created.id })
  })
})
