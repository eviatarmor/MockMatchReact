import { expect, it } from "vitest"
import {
  createCaller,
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"
describeIntegration("questions (integration)", () => {
  it("list returns paginated shape (may be empty)", async () => {
    const caller = await signupAuthedCaller()
    const result = await caller.questions.list({
      page: 1,
      pageSize: 20,
    })
    expect(Array.isArray(result.items)).toBe(true)
    expect(typeof result.total).toBe("number")
  })

  it("list accepts empty input defaults", async () => {
    const caller = await signupAuthedCaller()
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
