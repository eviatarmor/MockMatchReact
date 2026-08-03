import { expect, it } from "vitest"
import {
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"
describeIntegration("practiceExercises (integration)", () => {
  it("list returns array (may be empty without seed)", async () => {
    const caller = await signupAuthedCaller()
    const items = await caller.practiceExercises.list()
    expect(Array.isArray(items)).toBe(true)
  })

  it("list accepts optional format filter", async () => {
    const caller = await signupAuthedCaller()
    const items = await caller.practiceExercises.list({ format: "code_run" })
    expect(Array.isArray(items)).toBe(true)
    for (const item of items) {
      expect(item.format).toBe("code_run")
    }
  })

  it("bySlug 404 for unknown slug", async () => {
    const caller = await signupAuthedCaller()
    await expect(
      caller.practiceExercises.bySlug({ slug: "does-not-exist-xyz" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
  })
})
