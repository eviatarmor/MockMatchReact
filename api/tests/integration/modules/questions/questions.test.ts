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

  it("createCustom + deploy self appears in bank; team/global rejected", async () => {
    const caller = await signupAuthedCaller("custom-q")
    const other = await signupAuthedCaller("other-q")

    const created = await caller.questions.createCustom({
      title: `Custom MCQ ${Date.now()}`,
      domain: "coding",
      difficulty: "easy",
      format: "mcq",
      body: "Pick the even number.",
      payload: {
        stem: "Pick the even number.",
        options: ["1", "2", "3"],
        correctIndex: 1,
        variant: "single",
      },
    })
    expect(created.publishStatus).toBe("draft")
    expect(created.visibility).toBe("self")
    expect(created.isCustom).toBe(true)

    // Draft not in shared bank list
    const before = await caller.questions.list({
      customOnly: true,
      page: 1,
      pageSize: 50,
    })
    expect(before.items.some((i) => i.id === created.id)).toBe(false)

    // Non-self deploy rejected
    await expect(
      caller.questions.deploy({ id: created.id, scope: "team" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
    await expect(
      caller.questions.deploy({ id: created.id, scope: "global" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" })

    const deployed = await caller.questions.deploy({
      id: created.id,
      scope: "self",
    })
    expect(deployed.publishStatus).toBe("published")
    expect(deployed.visibility).toBe("self")

    const bank = await caller.questions.list({
      customOnly: true,
      page: 1,
      pageSize: 50,
    })
    expect(bank.items.some((i) => i.id === created.id && i.isCustom)).toBe(true)

    // Other user cannot see or open
    const otherBank = await other.questions.list({
      customOnly: true,
      page: 1,
      pageSize: 50,
    })
    expect(otherBank.items.some((i) => i.id === created.id)).toBe(false)
    await expect(other.questions.forMcq({ id: created.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    })

    // Owner can practice
    const mcq = await caller.questions.forMcq({ id: created.id })
    expect(mcq.options).toEqual(["1", "2", "3"])
  })

  it("simulationTypes lists all formats", async () => {
    const caller = await signupAuthedCaller("types")
    const types = await caller.questions.simulationTypes()
    expect(types.length).toBeGreaterThanOrEqual(8)
    expect(types.every((t) => t.createSupported)).toBe(true)
  })

  it("createCustom supports whiteboard / spreadsheet / page / conversation", async () => {
    const caller = await signupAuthedCaller("formats")
    const formats = [
      {
        format: "whiteboard" as const,
        body: "Draw a service diagram.",
        payload: { prompt: "Draw a service diagram." },
      },
      {
        format: "spreadsheet" as const,
        body: "Build a 3-year model.",
        payload: { prompt: "Build a 3-year model." },
      },
      {
        format: "page" as const,
        body: "Write a product memo.",
        payload: { prompt: "Write a product memo.", starterHtml: "<h1>Outline</h1>" },
      },
      {
        format: "conversation" as const,
        body: "Tell me about a conflict.",
        payload: { interviewerPrompt: "Tell me about a conflict.", trackHint: "behavioral-core" },
      },
      {
        format: "code_run" as const,
        body: "Implement sum.",
        language: "javascript",
        payload: { prompt: "Implement sum.", starterCode: "function sum(a,b){}" },
      },
    ]

    for (const f of formats) {
      const row = await caller.questions.createCustom({
        title: `Custom ${f.format} ${Date.now()}`,
        domain: "coding",
        difficulty: "medium",
        format: f.format,
        body: f.body,
        language: "language" in f ? f.language : undefined,
        payload: f.payload,
      })
      const dep = await caller.questions.deploy({ id: row.id, scope: "self" })
      expect(dep.publishStatus).toBe("published")
      expect(dep.format).toBe(f.format)
    }
  })
})
