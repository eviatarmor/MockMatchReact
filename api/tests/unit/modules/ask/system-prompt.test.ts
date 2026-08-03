import { describe, expect, it } from "vitest"
import { buildAskSystemPrompt } from "@/modules/ask/system-prompt.js"

describe("buildAskSystemPrompt", () => {
  it("includes product identity and guide content", () => {
    const prompt = buildAskSystemPrompt()
    expect(prompt).toContain("MockMatch Ask")
    expect(prompt.length).toBeGreaterThan(200)
  })
})
