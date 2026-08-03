import { describe, expect, it } from "vitest"
import {
  matchTierSchema,
  seniorityLevelSchema,
  trackedJobDtoSchema,
  trackedJobImportLocalInputSchema,
  trackedJobListInputSchema,
  trackedJobRemoveBySourceKeyInputSchema,
  trackedJobRemoveInputSchema,
  trackedJobReplaceStatusesInputSchema,
  trackedJobUpdateStatusInputSchema,
  trackedJobUpsertInputSchema,
  trackedJobUpsertResultSchema,
  trackingStatusSchema,
} from "@/tracked-jobs/api.js"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

const baseDto = {
  id: UUID,
  sourceKey: "manual:1",
  provider: "manual",
  externalId: null,
  title: "Engineer",
  company: "Acme",
  location: "Remote",
  description: null,
  applyUrl: null,
  status: "saved" as const,
  salaryRange: "—",
  seniority: "unknown" as const,
  matchScore: 42,
  matchTier: "fair" as const,
  avatarText: "AC",
  avatarColorClass: "bg-blue-500",
  postedAt: "2026-01-01",
  nextStepDate: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

describe("enums", () => {
  it("trackingStatus", () => {
    for (const s of [
      "saved",
      "applied",
      "interviewing",
      "offer",
      "declined",
    ] as const) {
      expect(trackingStatusSchema.parse(s)).toBe(s)
    }
    expect(() => trackingStatusSchema.parse("ghosted")).toThrow()
  })

  it("matchTier + seniority", () => {
    expect(matchTierSchema.parse("strong")).toBe("strong")
    expect(seniorityLevelSchema.parse("staff")).toBe("staff")
    expect(() => matchTierSchema.parse("perfect")).toThrow()
  })
})

describe("trackedJobListInputSchema", () => {
  it("optional body + optional status filter", () => {
    expect(trackedJobListInputSchema.parse(undefined)).toBeUndefined()
    expect(trackedJobListInputSchema.parse({}).status).toBeUndefined()
    expect(
      trackedJobListInputSchema.parse({ status: "offer" })?.status
    ).toBe("offer")
  })
})

describe("trackedJobUpsertInputSchema", () => {
  it("applies defaults", () => {
    const v = trackedJobUpsertInputSchema.parse({
      sourceKey: "adzuna:99",
      title: "SWE",
      company: "Co",
    })
    expect(v.provider).toBe("manual")
    expect(v.status).toBe("saved")
    expect(v.location).toBe("—")
    expect(v.matchScore).toBe(0)
    expect(v.matchTier).toBe("weak")
    expect(v.generateQuestions).toBe(false)
  })

  it("accepts full payload", () => {
    const v = trackedJobUpsertInputSchema.parse({
      sourceKey: "  adzuna:1  ",
      provider: "adzuna",
      externalId: "1",
      title: "Backend",
      company: "Acme",
      location: "Sydney",
      description: "Build APIs",
      applyUrl: "https://jobs.example/1",
      status: "applied",
      salaryRange: "100k",
      seniority: "senior",
      matchScore: 88,
      matchTier: "strong",
      avatarText: "AC",
      avatarColorClass: "bg-teal-500",
      postedAt: "yesterday",
      nextStepDate: "2026-02-01",
      generateQuestions: true,
    })
    expect(v.sourceKey).toBe("adzuna:1")
    expect(v.generateQuestions).toBe(true)
    expect(v.matchScore).toBe(88)
  })

  it("rejects empty sourceKey / out-of-range score", () => {
    expect(() =>
      trackedJobUpsertInputSchema.parse({
        sourceKey: "",
        title: "T",
        company: "C",
      })
    ).toThrow()
    expect(() =>
      trackedJobUpsertInputSchema.parse({
        sourceKey: "k",
        title: "T",
        company: "C",
        matchScore: 101,
      })
    ).toThrow()
  })
})

describe("trackedJobDtoSchema", () => {
  it("parses dto", () => {
    expect(trackedJobDtoSchema.parse(baseDto).title).toBe("Engineer")
  })

  it("allows optional questionsGeneratedAt", () => {
    const v = trackedJobDtoSchema.parse({
      ...baseDto,
      questionsGeneratedAt: "2026-01-02T00:00:00.000Z",
    })
    expect(v.questionsGeneratedAt).toContain("2026")
  })
})

describe("trackedJobUpsertResultSchema", () => {
  it("parses questionGen outcomes", () => {
    for (const q of [
      "started",
      "skipped_already",
      "skipped_no_flag",
      "skipped_no_key",
    ] as const) {
      expect(
        trackedJobUpsertResultSchema.parse({ job: baseDto, questionGen: q })
          .questionGen
      ).toBe(q)
    }
  })
})

describe("status mutations", () => {
  it("update status", () => {
    expect(
      trackedJobUpdateStatusInputSchema.parse({
        id: UUID,
        status: "interviewing",
      }).status
    ).toBe("interviewing")
  })

  it("replace statuses batch bounds", () => {
    expect(
      trackedJobReplaceStatusesInputSchema.parse({
        updates: [{ id: UUID, status: "offer" }],
      }).updates
    ).toHaveLength(1)

    expect(() =>
      trackedJobReplaceStatusesInputSchema.parse({ updates: [] })
    ).toThrow()

    expect(() =>
      trackedJobReplaceStatusesInputSchema.parse({
        updates: Array.from({ length: 101 }, () => ({
          id: UUID,
          status: "saved" as const,
        })),
      })
    ).toThrow()
  })
})

describe("remove + import", () => {
  it("remove by id / sourceKey", () => {
    expect(trackedJobRemoveInputSchema.parse({ id: UUID }).id).toBe(UUID)
    expect(
      trackedJobRemoveBySourceKeyInputSchema.parse({ sourceKey: "k" })
        .sourceKey
    ).toBe("k")
  })

  it("import local caps at 200", () => {
    expect(
      trackedJobImportLocalInputSchema.parse({
        jobs: [{ sourceKey: "a", title: "T", company: "C" }],
      }).jobs
    ).toHaveLength(1)

    expect(() =>
      trackedJobImportLocalInputSchema.parse({
        jobs: Array.from({ length: 201 }, (_, i) => ({
          sourceKey: `k${i}`,
          title: "T",
          company: "C",
        })),
      })
    ).toThrow()
  })
})
