import { expect, it } from "vitest"
import {
  createCaller,
  describeIntegration,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

async function signupUser(fullName = "Account User") {
  const email = `acct+${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const publicCaller = createCaller(null)
  await publicCaller.auth.requestOtp({
    purpose: "signup",
    email,
    fullName,
    agreeToTerms: true,
  })
  const { user } = await publicCaller.auth.verifyOtp({
    email,
    code: env.OTP_STUB_CODE || "000000",
    purpose: "signup",
  })
  return {
    user,
    caller: createCaller({ id: user.id, email: user.email }),
  }
}

describeIntegration("account (integration)", () => {
  it("get returns profile after signup", async () => {
    const { user, caller } = await signupUser("Profile User")
    const account = await caller.account.get()
    expect(account.id).toBe(user.id)
    expect(account.email).toBe(user.email)
    expect(account.fullName).toBe("Profile User")
    expect(account.preferences).toBeDefined()
    expect(account.preferences.language).toBeTruthy()
  })

  it("updateProfile changes fullName", async () => {
    const { caller } = await signupUser("Before Name")
    const updated = await caller.account.updateProfile({
      fullName: "After Name",
    })
    expect(updated.fullName).toBe("After Name")

    const again = await caller.account.get()
    expect(again.fullName).toBe("After Name")
  })

  it("updatePreferences merges language", async () => {
    const { caller } = await signupUser()
    const updated = await caller.account.updatePreferences({
      language: "en-GB",
    })
    expect(updated.preferences.language).toBe("en-GB")

    const again = await caller.account.get()
    expect(again.preferences.language).toBe("en-GB")
  })

  it("account.get requires auth", async () => {
    const publicCaller = createCaller(null)
    await expect(publicCaller.account.get()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    })
  })
})
