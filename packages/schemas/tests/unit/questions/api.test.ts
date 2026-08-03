import { describe, expect, it } from "vitest"
import {
  bankQuestionDtoSchema,
  generateFromJobsInputSchema,
  mcqSessionInputSchema,
  mcqSessionSchema,
  mcqVariantSchema,
  questionDifficultySchema,
  questionDomainSchema,
  questionFormatSchema,
  questionIdInputSchema,
  questionListInputSchema,
  questionMcqDetailSchema,
  questionPracticeDetailSchema,
  questionSummarySchema,
  questionUserStatusSchema,
  submitMcqInputSchema,
  submitMcqResultSchema,
} from "@/questions/api.js"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("question enums", () => {
  it("domain / difficulty / format / userStatus", () => {
    expect(questionDomainSchema.parse("coding")).toBe("coding")
    expect(questionDomainSchema.parse("systemDesign")).toBe("systemDesign")
    expect(() => questionDomainSchema.parse("alchemy")).toThrow()

    expect(questionDifficultySchema.parse("hard")).toBe("hard")
    expect(questionFormatSchema.parse("code_run")).toBe("code_run")
    expect(questionFormatSchema.parse("whiteboard")).toBe("whiteboard")
    expect(questionFormatSchema.parse("spreadsheet")).toBe("spreadsheet")
    expect(questionFormatSchema.parse("page")).toBe("page")

    expect(questionUserStatusSchema.parse("mastered")).toBe("mastered")
  })
})

describe("questionListInputSchema", () => {
  it("defaults page/pageSize when object provided", () => {
    const v = questionListInputSchema.parse({})
    expect(v?.page).toBe(1)
    expect(v?.pageSize).toBe(50)
  })

  it("accepts filters", () => {
    const v = questionListInputSchema.parse({
      search: " binary ",
      domains: ["coding", "ml"],
      difficulties: ["easy", "medium"],
      formats: ["mcq", "conversation"],
      userStatuses: ["new"],
      page: 2,
      pageSize: 20,
    })
    expect(v?.search).toBe("binary")
    expect(v?.domains).toEqual(["coding", "ml"])
  })

  it("caps array sizes", () => {
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

describe("questionIdInputSchema", () => {
  it("accepts uuid regex (loose)", () => {
    expect(questionIdInputSchema.parse({ id: UUID }).id).toBe(UUID)
    expect(() => questionIdInputSchema.parse({ id: "not-uuid" })).toThrow()
  })
})

describe("bankQuestionDtoSchema / summary / practice", () => {
  it("parses bank row", () => {
    const row = bankQuestionDtoSchema.parse({
      id: UUID,
      title: "Two sum",
      domain: "coding",
      difficulty: "easy",
      company: "FAANG",
      format: "code_run",
      language: "python",
      status: "new",
    })
    expect(row.company).toBe("FAANG")
  })

  it("parses conversation summary with track", () => {
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
  })

  it("rejects unknown conversationTrackId", () => {
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

  it("parses practice detail with uiFlags", () => {
    const d = questionPracticeDetailSchema.parse({
      id: UUID,
      title: "Sort",
      format: "code_run",
      domain: "coding",
      difficulty: "medium",
      language: "python",
      body: null,
      prompt: "Implement sort",
      trackId: "coding-sort",
      document: {
        tree: [{ id: "main.py", name: "main.py" }],
        files: { "main.py": { content: "pass" } },
      },
      uiFlags: {
        treeEnabled: true,
        defaultShowTree: true,
        defaultShowTerminal: true,
        openSeedTabs: true,
        tabsClosable: false,
        tests: [{ name: "t1", stdin: "", expectedStdout: "ok" }],
        entryPath: "main.py",
        runtimeLanguage: "python",
      },
    })
    expect(d.uiFlags.tests?.[0]?.name).toBe("t1")
  })
})

describe("generateFromJobsInputSchema", () => {
  it("requires 1–5 uuids", () => {
    expect(
      generateFromJobsInputSchema.parse({ trackedJobIds: [UUID] })
        .trackedJobIds
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

describe("MCQ schemas", () => {
  it("variant enum", () => {
    expect(mcqVariantSchema.parse("multi")).toBe("multi")
    expect(mcqVariantSchema.parse("order")).toBe("order")
  })

  it("questionMcqDetailSchema needs 2–6 options", () => {
    const ok = questionMcqDetailSchema.parse({
      id: UUID,
      title: "Q",
      format: "mcq",
      domain: "product",
      difficulty: "easy",
      company: null,
      stem: "Pick one",
      options: ["A", "B"],
      variant: "single",
    })
    expect(ok.options).toHaveLength(2)

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

    expect(
      submitMcqInputSchema.parse({
        id: UUID,
        selectedIndices: [0, 2],
      }).selectedIndices
    ).toEqual([0, 2])

    expect(
      submitMcqInputSchema.parse({
        id: UUID,
        orderedIndices: [1, 0],
      }).orderedIndices
    ).toEqual([1, 0])

    expect(() => submitMcqInputSchema.parse({ id: UUID })).toThrow()
    expect(() =>
      submitMcqInputSchema.parse({
        id: UUID,
        selectedIndex: 0,
        selectedIndices: [1],
      })
    ).toThrow()
  })

  it("submitMcqResultSchema", () => {
    const r = submitMcqResultSchema.parse({
      correct: true,
      variant: "single",
      correctIndex: 2,
      correctIndices: null,
      correctOrder: null,
      explanation: "Because",
      status: "attempted",
    })
    expect(r.correct).toBe(true)
  })

  it("mcqSessionInputSchema defaults limit", () => {
    expect(mcqSessionInputSchema.parse({ seedId: UUID }).limit).toBe(8)
    expect(() =>
      mcqSessionInputSchema.parse({ seedId: UUID, limit: 0 })
    ).toThrow()
    expect(() =>
      mcqSessionInputSchema.parse({ seedId: UUID, limit: 21 })
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
