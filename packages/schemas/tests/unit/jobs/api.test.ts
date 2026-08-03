import { describe, expect, it } from "vitest"
import {
  jobContractTypeSchema,
  jobEmploymentTypeSchema,
  jobProviderIdSchema,
  jobRemoteTypeSchema,
  jobSearchInputSchema,
  jobSearchResultSchema,
  jobSortBySchema,
  normalizedJobSchema,
} from "@/jobs/api.js"

describe("job enums", () => {
  it("provider / employment / contract / remote / sort", () => {
    expect(jobProviderIdSchema.parse("adzuna")).toBe("adzuna")
    expect(() => jobProviderIdSchema.parse("indeed")).toThrow()
    expect(jobEmploymentTypeSchema.parse("contract")).toBe("contract")
    expect(jobContractTypeSchema.parse("permanent")).toBe("permanent")
    expect(jobRemoteTypeSchema.parse("hybrid")).toBe("hybrid")
    expect(jobSortBySchema.parse("salary")).toBe("salary")
  })
})

describe("jobSearchInputSchema", () => {
  it("applies defaults", () => {
    const v = jobSearchInputSchema.parse({})
    expect(v.pageSize).toBe(20)
    expect(v.sortBy).toBe("relevance")
  })

  it("accepts filters", () => {
    const v = jobSearchInputSchema.parse({
      query: "react",
      country: "AU",
      where: "Sydney",
      remoteOnly: true,
      employmentTypes: ["fullTime", "contract"],
      salaryMin: 80_000,
      maxDaysOld: 7,
      sortBy: "date",
      cursor: 2,
      provider: "adzuna",
    })
    expect(v.query).toBe("react")
    expect(v.country).toBe("AU")
    expect(v.employmentTypes).toEqual(["fullTime", "contract"])
  })

  it("rejects huge pageSize / bad country / too many employment types", () => {
    expect(() => jobSearchInputSchema.parse({ pageSize: 50 })).toThrow()
    expect(() => jobSearchInputSchema.parse({ country: "DE" })).toThrow()
    expect(() =>
      jobSearchInputSchema.parse({
        employmentTypes: [
          "fullTime",
          "partTime",
          "contract",
          "internship",
          "unknown",
        ],
      })
    ).toThrow()
  })

  it("rejects maxDaysOld out of range", () => {
    expect(() => jobSearchInputSchema.parse({ maxDaysOld: 0 })).toThrow()
    expect(() => jobSearchInputSchema.parse({ maxDaysOld: 400 })).toThrow()
  })
})

describe("normalizedJobSchema / jobSearchResultSchema", () => {
  const job = {
    id: "adzuna:1",
    provider: "adzuna" as const,
    externalId: "1",
    title: "SWE",
    company: "Acme",
    location: "Remote",
    description: "Build stuff",
    applyUrl: "https://jobs.example/1",
    salaryMin: 100_000,
    salaryMax: 150_000,
    salaryIsPredicted: false,
    currencyHint: "USD",
    employmentType: "fullTime" as const,
    contractType: "permanent" as const,
    remoteType: "remote" as const,
    postedAt: "2026-01-01",
    category: "IT",
    latitude: null,
    longitude: null,
  }

  it("parses normalized job; applyUrl may be empty string", () => {
    expect(normalizedJobSchema.parse(job).title).toBe("SWE")
    expect(
      normalizedJobSchema.parse({ ...job, applyUrl: "" }).applyUrl
    ).toBe("")
    expect(() =>
      normalizedJobSchema.parse({ ...job, applyUrl: "not-url" })
    ).toThrow()
  })

  it("parses search result", () => {
    const r = jobSearchResultSchema.parse({
      items: [job],
      total: 1,
      page: 1,
      pageSize: 20,
      provider: "adzuna",
      cached: false,
      country: "US",
      where: null,
    })
    expect(r.items).toHaveLength(1)
    expect(r.cached).toBe(false)
  })
})
