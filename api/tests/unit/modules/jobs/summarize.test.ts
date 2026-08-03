import { describe, expect, it } from "vitest"
import type { JobSummaryStub } from "@mockmatch/schemas"
import { heuristicSummary } from "@/modules/jobs/summarize.js"

function job(overrides: Partial<JobSummaryStub> = {}): JobSummaryStub {
  return {
    id: "j1",
    title: "Backend Engineer",
    company: "Acme",
    description: "Build APIs. Ship features weekly. Own reliability.",
    location: "NYC",
    ...overrides,
  }
}

describe("heuristicSummary", () => {
  it("falls back to title/company/location when description empty", () => {
    expect(heuristicSummary(job({ description: "" }))).toBe(
      "Backend Engineer at Acme · NYC."
    )
    expect(
      heuristicSummary(job({ description: "   ", location: undefined }))
    ).toBe("Backend Engineer at Acme.")
  })

  it("uses first sentences from description", () => {
    const summary = heuristicSummary(
      job({
        description:
          "We build cloud platforms. You will design services. Extra fluff here that may not be needed.",
      })
    )
    expect(summary).toContain("We build cloud platforms.")
    expect(summary.length).toBeLessThanOrEqual(281)
    expect(/[.!?]$/.test(summary)).toBe(true)
  })

  it("strips trailing ellipsis artifacts", () => {
    const summary = heuristicSummary(
      job({ description: "Own the roadmap for payments infrastructure..." })
    )
    expect(summary.endsWith("...")).toBe(false)
    expect(summary.endsWith(".")).toBe(true)
  })

  it("truncates very long single sentences", () => {
    const long = `${"word ".repeat(100)}. more.`
    const summary = heuristicSummary(job({ description: long }))
    expect(summary.length).toBeLessThanOrEqual(281)
  })

  it("appends period when missing terminal punctuation", () => {
    const summary = heuristicSummary(
      job({ description: "Short blurb without end mark" })
    )
    expect(summary.endsWith(".")).toBe(true)
  })
})
