import { describe, expect, it } from "vitest"
import {
  discoverJobToTracked,
  parseJobDescriptionToTracked,
} from "@/features/applications/lib/map-tracked-job"
import type { DiscoverJob } from "@/features/discover/types"

function job(overrides: Partial<DiscoverJob> = {}): DiscoverJob {
  return {
    id: "d-1",
    provider: "adzuna",
    title: "Backend Engineer",
    company: "Stripe",
    avatarText: "ST",
    avatarColorClass: "bg-red-500",
    isNew: true,
    location: "Remote",
    remoteType: "remote",
    salaryRange: "$150K",
    salaryMin: 150000,
    salaryMax: 150000,
    seniority: "senior",
    employmentType: "full_time",
    postedAt: "1d ago",
    postedAtIso: "2026-01-10T00:00:00.000Z",
    description: "APIs.",
    applyUrl: "https://stripe.com/jobs/1",
    category: "Engineering",
    matchScore: 88,
    matchTier: "strong",
    ...overrides,
  }
}

describe("discoverJobToTracked", () => {
  it("maps discover job into saved tracked job", () => {
    const tracked = discoverJobToTracked(job())
    expect(tracked.id).toBe("d-1")
    expect(tracked.status).toBe("saved")
    expect(tracked.matchScore).toBe(88)
    expect(tracked.matchTier).toBe("strong")
    expect(tracked.progressCompleted).toBe(0)
    expect(tracked.applyUrl).toBe("https://stripe.com/jobs/1")
  })

  it("derives tier from score when matchTier missing", () => {
    expect(discoverJobToTracked(job({ matchScore: 90, matchTier: undefined })).matchTier).toBe(
      "strong"
    )
    expect(discoverJobToTracked(job({ matchScore: 80, matchTier: undefined })).matchTier).toBe(
      "good"
    )
    expect(discoverJobToTracked(job({ matchScore: 65, matchTier: undefined })).matchTier).toBe(
      "fair"
    )
    expect(discoverJobToTracked(job({ matchScore: 10, matchTier: undefined })).matchTier).toBe(
      "weak"
    )
    expect(discoverJobToTracked(job({ matchScore: undefined, matchTier: undefined })).matchTier).toBe(
      "weak"
    )
  })
})

describe("parseJobDescriptionToTracked", () => {
  it("parses 'Title at Company' first line", () => {
    const tracked = parseJobDescriptionToTracked(
      "Staff Engineer at Notion\nLocation: SF\n\nBuild tools."
    )
    expect(tracked.title).toBe("Staff Engineer")
    expect(tracked.company).toBe("Notion")
    expect(tracked.location).toBe("SF")
    expect(tracked.provider).toBe("import")
    expect(tracked.status).toBe("saved")
    expect(tracked.description).toContain("Build tools")
  })

  it("uses second short line as company", () => {
    const tracked = parseJobDescriptionToTracked("Product Manager\nFigma\nDesign systems")
    expect(tracked.title).toBe("Product Manager")
    expect(tracked.company).toBe("Figma")
  })

  it("reads Company: and Location: labels when line 2 is body text", () => {
    // Line 2 ends with period → not treated as company name; label scan runs
    const tracked = parseJobDescriptionToTracked(
      "SWE\nGreat opportunity for builders.\nCompany: Acme Corp\nWhere: Melbourne"
    )
    expect(tracked.title).toBe("SWE")
    expect(tracked.company).toBe("Acme Corp")
    expect(tracked.location).toBe("Melbourne")
  })

  it("falls back for empty paste", () => {
    const tracked = parseJobDescriptionToTracked("   ")
    expect(tracked.title).toBe("Untitled role")
    expect(tracked.company).toBe("Unknown company")
  })
})
