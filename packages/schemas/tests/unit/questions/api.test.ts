import { describe, expect, it } from "vitest"
import {
  generateFromJobsInputSchema,
  mcqSessionInputSchema,
  mcqSessionSchema,
  questionListInputSchema,
  questionMcqDetailSchema,
  questionSummarySchema,
  submitMcqInputSchema,
} from "@/questions/api.js"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("questionListInputSchema", () => {
  it("defaults page/pageSize and trims search", () => {
    const v = questionListInputSchema.parse({ search: " binary " })
    expect(v?.page).toBe(1)
    expect(v?.pageSize).toBe(50)
    expect(v?.search).toBe("binary")
  })

  it("caps filter array sizes", () => {
    expect(() =>
      questionListInputSchema.parse({
        difficulties: ["easy", "medium", "hard", "easy"],
      })
    ).toThrow()
  })

  it("allows undefined (optional whole input)", () => {
    expect(questionListInputSchema.parse(undefined)).toBeUndefined()
  })
})

describe("questionSummarySchema", () => {
  it("accepts known conversationTrackId and rejects unknown", () => {
    const s = questionSummarySchema.parse({
      id: UUID,
      title: "Tell me about yourself",
      format: "conversation",
      domain: "behavioral",
      difficulty: "medium",
      body: null,
      trackHint: "behavioral",
      conversationTrackId: "behavioral-core",
    })
    expect(s.conversationTrackId).toBe("behavioral-core")

    expect(() =>
      questionSummarySchema.parse({
        id: UUID,
        title: "x",
        format: "conversation",
        domain: "behavioral",
        difficulty: "easy",
        body: null,
        trackHint: null,
        conversationTrackId: "unknown-track",
      })
    ).toThrow()
  })
})

describe("generateFromJobsInputSchema", () => {
  it("requires 1–5 uuids", () => {
    expect(
      generateFromJobsInputSchema.parse({ trackedJobIds: [UUID] }).trackedJobIds
    ).toHaveLength(1)
    expect(() =>
      generateFromJobsInputSchema.parse({ trackedJobIds: [] })
    ).toThrow()
    expect(() =>
      generateFromJobsInputSchema.parse({
        trackedJobIds: Array.from({ length: 6 }, () => UUID),
      })
    ).toThrow()
  })
})

describe("MCQ contracts", () => {
  it("questionMcqDetailSchema needs 2–6 options", () => {
    expect(
      questionMcqDetailSchema.parse({
        id: UUID,
        title: "Q",
        format: "mcq",
        domain: "product",
        difficulty: "easy",
        company: null,
        stem: "Pick one",
        options: ["A", "B"],
        variant: "single",
      }).options
    ).toHaveLength(2)

    expect(() =>
      questionMcqDetailSchema.parse({
        id: UUID,
        title: "Q",
        format: "mcq",
        domain: "product",
        difficulty: "easy",
        company: null,
        stem: "x",
        options: ["only"],
        variant: "single",
      })
    ).toThrow()
  })

  it("submitMcqInputSchema requires exactly one answer mode", () => {
    expect(
      submitMcqInputSchema.parse({ id: UUID, selectedIndex: 1 }).selectedIndex
    ).toBe(1)
    expect(() => submitMcqInputSchema.parse({ id: UUID })).toThrow()
    expect(() =>
      submitMcqInputSchema.parse({
        id: UUID,
        selectedIndex: 0,
        selectedIndices: [1],
      })
    ).toThrow()
  })

  it("mcqSessionInputSchema defaults limit and bounds it", () => {
    expect(mcqSessionInputSchema.parse({ seedId: UUID }).limit).toBe(8)
    expect(() =>
      mcqSessionInputSchema.parse({ seedId: UUID, limit: 0 })
    ).toThrow()
  })

  it("mcqSessionSchema needs ≥1 question", () => {
    const q = {
      id: UUID,
      title: "Q",
      format: "mcq" as const,
      domain: "coding" as const,
      difficulty: "easy" as const,
      company: null,
      stem: "?",
      options: ["a", "b"],
      variant: "single" as const,
    }
    expect(
      mcqSessionSchema.parse({
        seedId: UUID,
        domain: "coding",
        questions: [q],
      }).questions
    ).toHaveLength(1)
    expect(() =>
      mcqSessionSchema.parse({
        seedId: UUID,
        domain: "coding",
        questions: [],
      })
    ).toThrow()
  })
})
