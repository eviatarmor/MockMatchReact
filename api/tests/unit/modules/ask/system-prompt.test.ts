import { describe, expect, it } from "vitest"
import { buildAskSystemPrompt } from "@/modules/ask/system-prompt.js"

describe("buildAskSystemPrompt", () => {
  it("includes product identity and guide sections", () => {
    const prompt = buildAskSystemPrompt()
    expect(prompt).toContain("MockMatch Ask")
    expect(prompt).toMatch(/How-tos|how-to/i)
    expect(prompt).toContain("Resume Lab")
  })
})
