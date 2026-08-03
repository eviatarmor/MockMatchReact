import { expect, it } from "vitest"
import {
  createCaller,
  describeIntegration,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

async function signupCaller() {
  const email = `q+${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const publicCaller = createCaller(null)
  await publicCaller.auth.requestOtp({
    purpose: "signup",
    email,
    fullName: "Questions User",
    agreeToTerms: true,
  })
  const { user } = await publicCaller.auth.verifyOtp({
    email,
    code: env.OTP_STUB_CODE || "000000",
    purpose: "signup",
  })
  return createCaller({ id: user.id, email: user.email })
}

describeIntegration("questions (integration)", () => {
  it("list returns paginated shape (may be empty)", async () => {
    const caller = await signupCaller()
    const result = await caller.questions.list({
      page: 1,
      pageSize: 20,
    })
    expect(Array.isArray(result.items)).toBe(true)
    expect(typeof result.total).toBe("number")
  })

  it("list accepts empty input defaults", async () => {
    const caller = await signupCaller()
    const result = await caller.questions.list()
    expect(Array.isArray(result.items)).toBe(true)
    expect(typeof result.total).toBe("number")
  })

  it("list requires auth", async () => {
    const publicCaller = createCaller(null)
    await expect(publicCaller.questions.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    })
  })
})
