import { expect, it } from "vitest"
import {
  createCaller,
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"

describeIntegration("account (integration)", () => {
  it("get returns profile after signup", async () => {
    const caller = await signupAuthedCaller("acct")
    const account = await caller.account.get()
    expect(account.email).toContain("@")
    expect(account.id).toBeTruthy()
  })

  it("updateProfile changes fullName", async () => {
    const caller = await signupAuthedCaller("acct")
    const updated = await caller.account.updateProfile({
      fullName: "After Name",
    })
    expect(updated.fullName).toBe("After Name")
  })

  it("updatePreferences accepts country", async () => {
    const caller = await signupAuthedCaller("acct")
    const account = await caller.account.updatePreferences({
      country: "AU",
    })
    expect(account.preferences?.country).toBe("AU")
  })

  it("get requires auth", async () => {
    const pub = createCaller(null)
    await expect(pub.account.get()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    })
  })
})
