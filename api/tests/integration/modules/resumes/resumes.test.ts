import { expect, it } from "vitest"
import {
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

describeIntegration("resumes (integration)", () => {
  it("list → create → get → delete", async () => {
    const caller = await signupAuthedCaller()

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
