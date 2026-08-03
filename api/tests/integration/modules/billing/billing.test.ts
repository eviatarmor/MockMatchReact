import { expect, it } from "vitest"
import {
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"

describeIntegration("billing (integration)", () => {
  it("summary available after signup", async () => {
    const caller = await signupAuthedCaller("bill")
    const summary = await caller.billing.summary()
    expect(summary.plan).toBe("free")
    expect(summary.credits).toBeDefined()
    expect(typeof summary.stripeConfigured).toBe("boolean")
  })
})
