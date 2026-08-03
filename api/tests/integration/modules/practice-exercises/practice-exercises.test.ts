import { expect, it } from "vitest"
import {
  createCaller,
  describeIntegration,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

async function signupCaller() {
  const email = `pe+${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const publicCaller = createCaller(null)
  await publicCaller.auth.requestOtp({
    purpose: "signup",
    email,
    fullName: "Practice Exercises User",
    agreeToTerms: true,
  })
  const { user } = await publicCaller.auth.verifyOtp({
    email,
    code: env.OTP_STUB_CODE || "000000",
    purpose: "signup",
  })
  return createCaller({ id: user.id, email: user.email })
}

describeIntegration("practiceExercises (integration)", () => {
  it("list returns array (may be empty without seed)", async () => {
    const caller = await signupCaller()
    const items = await caller.practiceExercises.list()
    expect(Array.isArray(items)).toBe(true)
  })

  it("list accepts optional format filter", async () => {
    const caller = await signupCaller()
    const items = await caller.practiceExercises.list({ format: "code_run" })
    expect(Array.isArray(items)).toBe(true)
    for (const item of items) {
      expect(item.format).toBe("code_run")
    }
  })

  it("bySlug 404 for unknown slug", async () => {
    const caller = await signupCaller()
    await expect(
      caller.practiceExercises.bySlug({ slug: "does-not-exist-xyz" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
  })
})
