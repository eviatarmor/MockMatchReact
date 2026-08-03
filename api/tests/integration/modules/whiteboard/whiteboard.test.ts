import { expect, it } from "vitest"
import {
  createCaller,
  describeIntegration,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

async function signupCaller() {
  const email = `wb+${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const publicCaller = createCaller(null)
  await publicCaller.auth.requestOtp({
    purpose: "signup",
    email,
    fullName: "Whiteboard User",
    agreeToTerms: true,
  })
  const { user } = await publicCaller.auth.verifyOtp({
    email,
    code: env.OTP_STUB_CODE || "000000",
    purpose: "signup",
  })
  return createCaller({ id: user.id, email: user.email })
}

describeIntegration("whiteboard (integration)", () => {
  it("create → get → update → delete", async () => {
    const caller = await signupCaller()

    const created = await caller.whiteboard.create({
      title: "Test Board",
    })
    expect(created.id).toBeTruthy()
    expect(created.title).toBe("Test Board")
    expect(created.document).toBeDefined()

    const one = await caller.whiteboard.get({ id: created.id })
    expect(one.id).toBe(created.id)

    const updated = await caller.whiteboard.update({
      id: created.id,
      title: "Renamed Board",
    })
    expect(updated.title).toBe("Renamed Board")

    await caller.whiteboard.delete({ id: created.id })
    await expect(
      caller.whiteboard.get({ id: created.id })
    ).rejects.toBeTruthy()
  })
})
