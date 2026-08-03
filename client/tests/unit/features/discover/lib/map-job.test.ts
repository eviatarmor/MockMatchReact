import { describe, expect, it } from "vitest"
import { formatSalaryRange, heuristicJobSummary } from "@/features/discover/lib/map-job"

describe("formatSalaryRange", () => {
  it("returns em dash when both ends null", () => {
    expect(formatSalaryRange(null, null, "USD", false)).toBe("—")
  })

  it("formats min–max with currency symbols", () => {
    expect(formatSalaryRange(100000, 150000, "USD", false)).toBe("$100K – $150K")
    expect(formatSalaryRange(80000, 90000, "GBP", false)).toBe("£80K – £90K")
    expect(formatSalaryRange(120000, 140000, "AUD", false)).toBe(
      "A$120K – A$140K"
    )
  })

  it("collapses equal min/max to single amount", () => {
    expect(formatSalaryRange(100000, 100000, "USD", false)).toBe("$100K")
  })

  it("formats open-ended ranges", () => {
    expect(formatSalaryRange(90000, null, "USD", false)).toBe("$90K+")
    expect(formatSalaryRange(null, 50000, "USD", false)).toBe("Up to $50K")
  })

  it("prefixes predicted salaries with ~", () => {
    expect(formatSalaryRange(100000, 120000, "USD", true)).toBe(
      "~$100K – $120K"
    )
  })

  it("falls back to $ for unknown currency", () => {
    expect(formatSalaryRange(5000, null, "EUR", false)).toBe("$5K+")
  })

  it("formats small amounts without K", () => {
    expect(formatSalaryRange(500, null, "USD", false)).toBe("$500+")
  })
})

describe("heuristicJobSummary", () => {
  it("falls back to title/company when description empty", () => {
    expect(
      heuristicJobSummary({
        title: "Engineer",
        company: "Acme",
        location: "Sydney",
        description: "",
      })
    ).toBe("Engineer at Acme · Sydney.")
  })

  it("takes first sentences and ensures terminal punctuation", () => {
    const out = heuristicJobSummary({
      title: "Role",
      company: "Co",
      description: "We build tools. Join us now. Extra sentence ignored for short.",
    })
    expect(out).toMatch(/^We build tools\. Join us now\./)
  })

  it("truncates very long single-sentence blurbs", () => {
    const long = "Word ".repeat(100).trim()
    const out = heuristicJobSummary({
      title: "Role",
      company: "Co",
      description: long,
    })
    expect(out.length).toBeLessThanOrEqual(281)
    expect(out.endsWith("…") || out.endsWith(".")).toBe(true)
  })
})
