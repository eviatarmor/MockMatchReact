import { describe, expect, it } from "vitest"
import type { FitScore } from "@mockmatch/schemas"
import { blendHeuristicAndAi } from "@/modules/jobs/fit/score.js"

function makeScore(overrides: Partial<FitScore> = {}): FitScore {
  return {
    score: 50,
    tier: "fair",
    fitNote: "heuristic note",
    skills: [{ label: "React", matched: false }],
    mode: "heuristic",
    ...overrides,
  }
}

describe("blendHeuristicAndAi", () => {
  it("averages scores with equal weights and clamps", () => {
    const heuristic = makeScore({ score: 40, tier: "fair" })
    const ai = makeScore({
      score: 80,
      tier: "strong",
      fitNote: "AI note",
      skills: [{ label: "TypeScript", matched: false }],
      mode: "ai",
    })
    const blended = blendHeuristicAndAi(heuristic, ai)
    expect(blended.score).toBe(60)
    expect(blended.tier).toBe("good")
    expect(blended.mode).toBe("ai")
    expect(blended.fitNote).toBe("AI note")
  })

  it("falls back to heuristic fitNote when AI note empty", () => {
    const blended = blendHeuristicAndAi(
      makeScore({ fitNote: "from heuristic" }),
      makeScore({ fitNote: "", mode: "ai" })
    )
    expect(blended.fitNote).toBe("from heuristic")
  })

  it("merges skills preferring AI labels first, max 6", () => {
    const heuristic = makeScore({
      skills: [
        { label: "React", matched: false },
        { label: "CSS", matched: false },
        { label: "HTML", matched: false },
      ],
    })
    const ai = makeScore({
      mode: "ai",
      skills: [
        { label: "TypeScript", matched: false },
        { label: "react", matched: false },
        { label: "Node.js", matched: false },
        { label: "Docker", matched: false },
        { label: "AWS", matched: false },
        { label: "Kafka", matched: false },
        { label: "Extra", matched: false },
      ],
    })
    const blended = blendHeuristicAndAi(heuristic, ai)
    expect(blended.skills).toHaveLength(6)
    expect(blended.skills[0]!.label).toBe("TypeScript")
    // case-insensitive dedupe: React from heuristic skipped after AI "react"
    expect(blended.skills.map((s) => s.label.toLowerCase())).not.toContain("css")
  })

  it("clamps blended score to 0–100", () => {
    const high = blendHeuristicAndAi(
      makeScore({ score: 100 }),
      makeScore({ score: 100, mode: "ai" })
    )
    expect(high.score).toBe(100)
    expect(high.tier).toBe("strong")

    const low = blendHeuristicAndAi(
      makeScore({ score: 0 }),
      makeScore({ score: 0, mode: "ai" })
    )
    expect(low.score).toBe(0)
    expect(low.tier).toBe("weak")
  })
})
