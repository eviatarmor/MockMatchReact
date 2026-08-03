import { describe, expect, it } from "vitest"
import {
  trackedJobListInputSchema,
  trackedJobReplaceStatusesInputSchema,
  trackedJobUpdateStatusInputSchema,
  trackedJobUpsertInputSchema,
} from "@/tracked-jobs/api.js"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

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
  it("applies defaults and trims sourceKey", () => {
    const v = trackedJobUpsertInputSchema.parse({
      sourceKey: "  adzuna:99  ",
      title: "SWE",
      company: "Co",
    })
    expect(v.sourceKey).toBe("adzuna:99")
    expect(v.provider).toBe("manual")
    expect(v.status).toBe("saved")
    expect(v.location).toBe("—")
    expect(v.matchScore).toBe(0)
    expect(v.matchTier).toBe("weak")
    expect(v.generateQuestions).toBe(false)
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
        sourceKey: "x",
        title: "T",
        company: "C",
        matchScore: 101,
      })
    ).toThrow()
  })
})

describe("status mutations", () => {
  it("updateStatus requires uuid + status", () => {
    expect(
      trackedJobUpdateStatusInputSchema.parse({
        id: UUID,
        status: "applied",
      }).status
    ).toBe("applied")
    expect(() =>
      trackedJobUpdateStatusInputSchema.parse({
        id: "nope",
        status: "applied",
      })
    ).toThrow()
  })

  it("replaceStatuses validates updates array", () => {
    expect(
      trackedJobReplaceStatusesInputSchema.parse({
        updates: [{ id: UUID, status: "interviewing" }],
      }).updates[0]?.status
    ).toBe("interviewing")
    expect(() =>
      trackedJobReplaceStatusesInputSchema.parse({
        updates: [{ id: UUID, status: "ghosted" }],
      })
    ).toThrow()
  })
})
