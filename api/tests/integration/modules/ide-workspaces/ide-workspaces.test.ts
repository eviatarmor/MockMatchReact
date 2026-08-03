import { expect, it } from "vitest"
import {
  createCaller,
  describeIntegration,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

async function signupCaller() {
  const email = `ide+${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const publicCaller = createCaller(null)
  await publicCaller.auth.requestOtp({
    purpose: "signup",
    email,
    fullName: "IDE User",
    agreeToTerms: true,
  })
  const { user } = await publicCaller.auth.verifyOtp({
    email,
    code: env.OTP_STUB_CODE || "000000",
    purpose: "signup",
  })
  return createCaller({ id: user.id, email: user.email })
}

describeIntegration("ideWorkspaces (integration)", () => {
  it("list → create → get → delete", async () => {
    const caller = await signupCaller()

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
    const caller = await signupCaller()
    const original = await caller.ideWorkspaces.create({
      title: "Dup Source",
    })
    const copy = await caller.ideWorkspaces.duplicate({ id: original.id })
    expect(copy.id).not.toBe(original.id)

    await caller.ideWorkspaces.delete({ id: original.id })
    await caller.ideWorkspaces.delete({ id: copy.id })
  })
})
