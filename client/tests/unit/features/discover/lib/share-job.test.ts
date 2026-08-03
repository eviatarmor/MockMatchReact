import { describe, expect, it } from "vitest"
import {
  formatJobShareText,
  jobPageAbsoluteUrl,
  telegramShareUrl,
  whatsappShareUrl,
} from "@/features/discover/lib/share-job"
import type { DiscoverJob } from "@/features/discover/types"

function job(overrides: Partial<DiscoverJob> = {}): DiscoverJob {
  return {
    id: "job-1",
    provider: "adzuna",
    title: "Software Engineer",
    company: "Acme",
    avatarText: "AC",
    avatarColorClass: "bg-blue-500",
    isNew: false,
    location: "Sydney",
    remoteType: "hybrid",
    salaryRange: "$120K – $150K",
    salaryMin: 120000,
    salaryMax: 150000,
    seniority: "mid",
    employmentType: "full_time",
    postedAt: "2d ago",
    postedAtIso: "2026-01-01T00:00:00.000Z",
    description: "Build products.",
    applyUrl: "https://example.com/apply",
    category: "IT",
    ...overrides,
  }
}

describe("formatJobShareText", () => {
  it("includes title, company, location, salary, apply, page url", () => {
    const text = formatJobShareText(job(), "https://app.example/jobs/1")
    expect(text).toContain("Software Engineer at Acme")
    expect(text).toContain("Sydney · $120K – $150K")
    expect(text).toContain("Build products.")
    expect(text).toContain("Apply: https://example.com/apply")
    expect(text).toContain("https://app.example/jobs/1")
  })

  it("omits salary dash and empty description", () => {
    const text = formatJobShareText(
      job({ salaryRange: "—", description: "  ", applyUrl: "" })
    )
    expect(text).toContain("Software Engineer at Acme")
    expect(text).toContain("Sydney")
    expect(text).not.toContain("—")
    expect(text).not.toContain("Apply:")
  })

  it("truncates long descriptions", () => {
    const long = "x".repeat(500)
    const text = formatJobShareText(job({ description: long }))
    expect(text).toContain("…")
    expect(text.includes("x".repeat(500))).toBe(false)
  })
})

describe("share urls", () => {
  it("builds whatsapp and telegram urls", () => {
    expect(whatsappShareUrl("hello world")).toBe(
      "https://wa.me/?text=hello%20world"
    )
    expect(telegramShareUrl("hi", "https://ex.com")).toBe(
      "https://t.me/share/url?url=https%3A%2F%2Fex.com&text=hi"
    )
  })

  it("builds absolute job page url from origin", () => {
    expect(jobPageAbsoluteUrl("abc/def")).toMatch(
      /\/discover\/jobs\/abc%2Fdef$/
    )
  })
})
