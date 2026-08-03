import { expect, it } from "vitest"
import {
  createCaller,
  describeIntegration,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

async function signupCaller() {
  const email = `dv+${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const publicCaller = createCaller(null)
  await publicCaller.auth.requestOtp({
    purpose: "signup",
    email,
    fullName: "Versions User",
    agreeToTerms: true,
  })
  const { user } = await publicCaller.auth.verifyOtp({
    email,
    code: env.OTP_STUB_CODE || "000000",
    purpose: "signup",
  })
  return createCaller({ id: user.id, email: user.email })
}

describeIntegration("documentVersions (integration)", () => {
  it("list after resume create has at least one version", async () => {
    const caller = await signupCaller()
    const resume = await caller.resumes.create({ title: "Versioned Resume" })

    const page = await caller.documentVersions.list({
      kind: "resume",
      id: resume.id,
      pageSize: 15,
    })
    expect(Array.isArray(page.items)).toBe(true)
    expect(page.items.length).toBeGreaterThanOrEqual(1)
    expect(page.items[0]?.source).toBe("create")

    const versionId = page.items[0]!.id
    const detail = await caller.documentVersions.get({
      kind: "resume",
      id: resume.id,
      versionId,
    })
    expect(detail.id).toBe(versionId)
    expect(detail.document).toBeDefined()

    await caller.resumes.delete({ id: resume.id })
  })

  it("list after cover letter create", async () => {
    const caller = await signupCaller()
    const cl = await caller.coverLetters.create({ title: "Versioned CL" })

    const page = await caller.documentVersions.list({
      kind: "cover_letter",
      id: cl.id,
      pageSize: 10,
    })
    expect(page.items.length).toBeGreaterThanOrEqual(1)

    await caller.coverLetters.delete({ id: cl.id })
  })
})
