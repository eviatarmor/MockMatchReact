import { expect, it } from "vitest"
import {
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

describeIntegration("ideWorkspaces (integration)", () => {
  it("list → create → get → delete", async () => {
    const caller = await signupAuthedCaller()

    const before = await caller.ideWorkspaces.list({ page: 1, pageSize: 10 })
    expect(Array.isArray(before.items)).toBe(true)
    expect(typeof before.total).toBe("number")

    const created = await caller.ideWorkspaces.create({
      title: "Test Workspace",
    })
    expect(created.id).toBeTruthy()
    expect(created.title).toBe("Test Workspace")
    expect(created.document).toBeDefined()

    const one = await caller.ideWorkspaces.get({ id: created.id })
    expect(one.id).toBe(created.id)

    const after = await caller.ideWorkspaces.list({ page: 1, pageSize: 10 })
    expect(after.items.some((i) => i.id === created.id)).toBe(true)

    await caller.ideWorkspaces.delete({ id: created.id })
    await expect(
      caller.ideWorkspaces.get({ id: created.id })
    ).rejects.toBeTruthy()
  })

  it("duplicate creates a new workspace", async () => {
    const caller = await signupAuthedCaller()
    const original = await caller.ideWorkspaces.create({
      title: "Dup Source",
    })
    const copy = await caller.ideWorkspaces.duplicate({ id: original.id })
    expect(copy.id).not.toBe(original.id)

    await caller.ideWorkspaces.delete({ id: original.id })
    await caller.ideWorkspaces.delete({ id: copy.id })
  })
})
