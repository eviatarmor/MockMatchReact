import { expect, it } from "vitest"
import {
  createCaller,
  describeIntegration,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

async function signupCaller() {
  const email = `resume+${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const publicCaller = createCaller(null)
  await publicCaller.auth.requestOtp({
    purpose: "signup",
    email,
    fullName: "Resume User",
    agreeToTerms: true,
  })
  const { user } = await publicCaller.auth.verifyOtp({
    email,
    code: env.OTP_STUB_CODE || "000000",
    purpose: "signup",
  })
  return createCaller({ id: user.id, email: user.email })
}

describeIntegration("resumes (integration)", () => {
  it("list → create → get → delete", async () => {
    const caller = await signupCaller()

    const before = await caller.resumes.list({ page: 1, pageSize: 10 })
    expect(Array.isArray(before.items)).toBe(true)

    const created = await caller.resumes.create({
      title: "Test Resume",
    })
    expect(created.id).toBeTruthy()
    expect(created.title).toBe("Test Resume")

    const one = await caller.resumes.get({ id: created.id })
    expect(one.id).toBe(created.id)

    await caller.resumes.delete({ id: created.id })
    await expect(caller.resumes.get({ id: created.id })).rejects.toBeTruthy()
  })
})
