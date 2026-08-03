import { expect, it } from "vitest"
import { eq } from "drizzle-orm"
import {
  createCaller,
  describeIntegration,
} from "../../../helpers/integration.js"
import { db } from "@/db/client.js"
import { users } from "@/db/schema/users.js"
import { env } from "@/config/env.js"

describeIntegration("auth OTP flow (integration)", () => {
  const uniqueEmail = () =>
    `test+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`

  it("signup requestOtp + verifyOtp creates user", async () => {
    const email = uniqueEmail()
    const publicCaller = createCaller(null)

    await publicCaller.auth.requestOtp({
      purpose: "signup",
      email,
      fullName: "Test User",
      agreeToTerms: true,
    })

    const code = env.OTP_STUB_CODE || "000000"
    const result = await publicCaller.auth.verifyOtp({
      email,
      code,
      purpose: "signup",
    })

    expect(result.user.email).toBe(email.toLowerCase())
    expect(result.user.fullName).toBe("Test User")
    expect(result.user.id).toBeTruthy()

    const row = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    })
    expect(row?.fullName).toBe("Test User")
  })

  it("login requestOtp for unknown email succeeds without user", async () => {
    const publicCaller = createCaller(null)
    const out = await publicCaller.auth.requestOtp({
      purpose: "login",
      email: uniqueEmail(),
    })
    expect(out).toEqual({ ok: true })
  })

  it("auth.me requires session", async () => {
    const publicCaller = createCaller(null)
    await expect(publicCaller.auth.me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    })
  })

  it("auth.me works for authenticated user", async () => {
    const email = uniqueEmail()
    const publicCaller = createCaller(null)
    await publicCaller.auth.requestOtp({
      purpose: "signup",
      email,
      fullName: "Me User",
      agreeToTerms: true,
    })
    const { user } = await publicCaller.auth.verifyOtp({
      email,
      code: env.OTP_STUB_CODE || "000000",
      purpose: "signup",
    })

    const authed = createCaller({ id: user.id, email: user.email })
    const me = await authed.auth.me()
    expect(me.id).toBe(user.id)
    expect(me.email).toBe(user.email)
  })
})
