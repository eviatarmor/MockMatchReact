import { expect, it } from "vitest"
import {
  createCaller,
  describeIntegration,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

async function signupCaller() {
  const email = `cl+${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const publicCaller = createCaller(null)
  await publicCaller.auth.requestOtp({
    purpose: "signup",
    email,
    fullName: "Cover Letter User",
    agreeToTerms: true,
  })
  const { user } = await publicCaller.auth.verifyOtp({
    email,
    code: env.OTP_STUB_CODE || "000000",
    purpose: "signup",
  })
  return createCaller({ id: user.id, email: user.email })
}

describeIntegration("coverLetters (integration)", () => {
  it("list → create → get → delete", async () => {
    const caller = await signupCaller()

    const before = await caller.coverLetters.list({ page: 1, pageSize: 10 })
    expect(Array.isArray(before.items)).toBe(true)
    expect(typeof before.total).toBe("number")

    const created = await caller.coverLetters.create({
      title: "Test Cover Letter",
      company: "Acme",
    })
    expect(created.id).toBeTruthy()
    expect(created.title).toBe("Test Cover Letter")
    expect(created.company).toBe("Acme")

    const one = await caller.coverLetters.get({ id: created.id })
    expect(one.id).toBe(created.id)
    expect(one.document).toBeDefined()

    const after = await caller.coverLetters.list({ page: 1, pageSize: 10 })
    expect(after.items.some((i) => i.id === created.id)).toBe(true)

    await caller.coverLetters.delete({ id: created.id })
    await expect(
      caller.coverLetters.get({ id: created.id })
    ).rejects.toBeTruthy()
  })

  it("duplicate creates a new row", async () => {
    const caller = await signupCaller()
    const original = await caller.coverLetters.create({
      title: "Original CL",
    })
    const copy = await caller.coverLetters.duplicate({ id: original.id })
    expect(copy.id).not.toBe(original.id)
    expect(copy.title).toContain("Original CL")

    await caller.coverLetters.delete({ id: original.id })
    await caller.coverLetters.delete({ id: copy.id })
  })
})
