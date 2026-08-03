import { describe, expect, it } from "vitest"
import {
  fitCoverLetterInputSchema,
  fitDocumentResultSchema,
  fitModeSchema,
  fitResumeInputSchema,
  fitScoreSchema,
  fitSkillTagSchema,
  fitTierSchema,
  jobFitStubSchema,
  scoreFitsInputSchema,
  scoreFitsResultSchema,
  summarizeJobsInputSchema,
  summarizeJobsResultSchema,
} from "@/jobs/fit.js"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

const jobStub = {
  id: "adzuna:1",
  title: "Engineer",
  company: "Acme",
  description: "Build things",
}

describe("fit enums + skill tag", () => {
  it("tier / mode", () => {
    expect(fitTierSchema.parse("good")).toBe("good")
    expect(fitModeSchema.parse("heuristic")).toBe("heuristic")
    expect(fitModeSchema.parse("none")).toBe("none")
  })

  it("skill tag defaults matched=false", () => {
    expect(fitSkillTagSchema.parse({ label: "React" }).matched).toBe(false)
    expect(fitSkillTagSchema.parse({ label: "Go", matched: true }).matched).toBe(
      true
    )
    expect(() => fitSkillTagSchema.parse({ label: "" })).toThrow()
  })
})

describe("fitScoreSchema", () => {
  it("accepts score 0–100 with skills cap", () => {
    const s = fitScoreSchema.parse({
      score: 75,
      tier: "good",
      fitNote: "Solid overlap",
      skills: [{ label: "TS" }],
      mode: "ai",
    })
    expect(s.score).toBe(75)
  })

  it("rejects score > 100 / >8 skills", () => {
    expect(() =>
      fitScoreSchema.parse({
        score: 101,
        tier: "strong",
        fitNote: "",
        skills: [],
        mode: "heuristic",
      })
    ).toThrow()
    expect(() =>
      fitScoreSchema.parse({
        score: 50,
        tier: "fair",
        fitNote: "",
        skills: Array.from({ length: 9 }, (_, i) => ({ label: `s${i}` })),
        mode: "ai",
      })
    ).toThrow()
  })
})

describe("scoreFitsInputSchema / result", () => {
  it("defaults preferAi; requires 1–20 jobs", () => {
    const v = scoreFitsInputSchema.parse({ jobs: [jobStub] })
    expect(v.preferAi).toBe(true)
    expect(() => scoreFitsInputSchema.parse({ jobs: [] })).toThrow()
    expect(() =>
      scoreFitsInputSchema.parse({
        jobs: Array.from({ length: 21 }, (_, i) => ({
          ...jobStub,
          id: `j${i}`,
        })),
      })
    ).toThrow()
  })

  it("parses result map", () => {
    const r = scoreFitsResultSchema.parse({
      resumeCount: 1,
      profileHash: "abc",
      mode: "ai",
      scores: {
        "adzuna:1": {
          score: 80,
          tier: "strong",
          fitNote: "Good",
          skills: [],
          mode: "ai",
        },
      },
      creditsCharged: 1,
      creditsRemaining: 9,
    })
    expect(r.scores["adzuna:1"]?.tier).toBe("strong")
  })
})

describe("summarizeJobs", () => {
  it("input + result", () => {
    expect(
      summarizeJobsInputSchema.parse({ jobs: [jobStub] }).jobs
    ).toHaveLength(1)

    const r = summarizeJobsResultSchema.parse({
      summaries: { "adzuna:1": "Short summary" },
      mode: "heuristic",
    })
    expect(r.summaries["adzuna:1"]).toBe("Short summary")
  })

  it("rejects long summary", () => {
    expect(() =>
      summarizeJobsResultSchema.parse({
        summaries: { a: "x".repeat(401) },
        mode: "ai",
      })
    ).toThrow()
  })
})

describe("fit document inputs", () => {
  it("fitResumeInputSchema", () => {
    const v = fitResumeInputSchema.parse({
      job: jobStub,
      sourceResumeId: UUID,
    })
    expect(v.sourceResumeId).toBe(UUID)
    expect(() =>
      fitResumeInputSchema.parse({
        job: jobStub,
        sourceResumeId: "bad",
      })
    ).toThrow()
  })

  it("fitCoverLetterInputSchema optional sources", () => {
    const v = fitCoverLetterInputSchema.parse({ job: jobFitStubSchema.parse(jobStub) })
    expect(v.sourceCoverLetterId).toBeUndefined()
  })

  it("fitDocumentResultSchema", () => {
    const r = fitDocumentResultSchema.parse({
      documentId: UUID,
      title: "Tailored resume",
      fitScore: {
        score: 70,
        tier: "good",
        fitNote: "ok",
        skills: [],
        mode: "ai",
      },
      creditsCharged: 2,
      creditsRemaining: 0,
      mode: "ai",
    })
    expect(r.mode).toBe("ai")
  })
})
