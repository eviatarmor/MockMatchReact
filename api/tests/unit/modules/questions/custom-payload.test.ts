import { describe, expect, it } from "vitest"
import { TRPCError } from "@trpc/server"
import {
  normalizeCustomQuestionPayload,
  SIMULATION_TYPES,
} from "@/modules/questions/custom-payload.js"

describe("normalizeCustomQuestionPayload", () => {
  it("normalizes mcq single", () => {
    const r = normalizeCustomQuestionPayload({
      format: "mcq",
      domain: "coding",
      body: "What is 2+2?",
      payload: {
        options: ["3", "4", "5"],
        correctIndex: 1,
      },
    })
    expect(r.payload).toMatchObject({
      stem: "What is 2+2?",
      options: ["3", "4", "5"],
      variant: "single",
      correctIndex: 1,
    })
  })

  it("rejects mcq without options", () => {
    expect(() =>
      normalizeCustomQuestionPayload({
        format: "mcq",
        domain: "coding",
        body: "stem",
        payload: { options: ["only-one"], correctIndex: 0 },
      })
    ).toThrow(TRPCError)
  })

  it("normalizes conversation trackHint", () => {
    const r = normalizeCustomQuestionPayload({
      format: "conversation",
      domain: "product",
      body: "Tell me about a hard product decision.",
      payload: { trackHint: "bogus-track" },
    })
    expect(r.payload).toMatchObject({
      trackHint: "product-sense",
      interviewerPrompt: "Tell me about a hard product decision.",
    })
  })

  it("normalizes code_run with starter", () => {
    const r = normalizeCustomQuestionPayload({
      format: "code_run",
      domain: "coding",
      language: "python",
      body: "Implement reverse.",
      payload: {
        starterCode: "def reverse(s):\n    pass\n",
        tests: [{ name: "empty", stdin: "", expectedStdout: "" }],
      },
    })
    expect(r.language).toBe("python")
    expect(r.contentCache["main.py"]).toContain("def reverse")
    expect((r.payload as { tests?: unknown[] }).tests).toHaveLength(1)
  })

  it("normalizes whiteboard prompt", () => {
    const r = normalizeCustomQuestionPayload({
      format: "whiteboard",
      domain: "systemDesign",
      body: "Design a rate limiter.",
      payload: {},
    })
    expect(r.payload).toMatchObject({ prompt: "Design a rate limiter." })
  })

  it("covers every simulation type in catalog", () => {
    const formats = new Set(SIMULATION_TYPES.map((t) => t.format))
    for (const f of [
      "mcq",
      "code_run",
      "workspace",
      "terminal",
      "whiteboard",
      "spreadsheet",
      "page",
      "conversation",
    ] as const) {
      expect(formats.has(f)).toBe(true)
    }
    expect(SIMULATION_TYPES.every((t) => t.createSupported)).toBe(true)
  })
})
