import { describe, expect, it } from "vitest"
import { severityForGrammarKind } from "@/lib/grammar/severity"

describe("severityForGrammarKind", () => {
  it("maps spell to medium", () => {
    expect(severityForGrammarKind("Spelling")).toBe("medium")
    expect(severityForGrammarKind("spell_error")).toBe("medium")
  })

  it("maps grammar/other to low", () => {
    expect(severityForGrammarKind("Grammar")).toBe("low")
    expect(severityForGrammarKind("Style")).toBe("low")
  })
})
