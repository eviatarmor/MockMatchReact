import { expect, it } from "vitest"
import {
  createCaller,
  describeIntegration,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

describeIntegration("billing (integration)", () => {
  it("summary available after signup", async () => {
    const email = `bill+${Date.now()}@example.com`
    const publicCaller = createCaller(null)
    await publicCaller.auth.requestOtp({
      purpose: "signup",
      email,
      fullName: "Bill User",
      agreeToTerms: true,
    })
    const { user } = await publicCaller.auth.verifyOtp({
      email,
      code: env.OTP_STUB_CODE || "000000",
      purpose: "signup",
    })

    const authed = createCaller({ id: user.id, email: user.email })
    const summary = await authed.billing.summary()
    expect(summary.plan).toBe("free")
    expect(summary.credits).toBeDefined()
    expect(typeof summary.stripeConfigured).toBe("boolean")
  })
})
