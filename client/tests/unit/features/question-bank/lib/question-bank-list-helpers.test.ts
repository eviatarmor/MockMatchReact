import { describe, expect, it } from "vitest"
import {
  buildListQueryInput,
  computeHasFilters,
  countByField,
  mapListItemsToBankQuestions,
  toggleSet,
  type ListQuestionItem,
} from "@/features/question-bank/lib/question-bank-list-helpers"
import type { BankQuestion } from "@/features/question-bank/types"

const emptyFilters = {
  search: "",
  selectedDomains: new Set<BankQuestion["domain"]>(),
  selectedDifficulties: new Set<BankQuestion["difficulty"]>(),
  selectedStatuses: new Set<BankQuestion["status"]>(),
  customOnly: false,
}

describe("toggleSet", () => {
  it("adds missing value and removes present value", () => {
    const withA = toggleSet(new Set(["a"]), "b")
    expect([...withA].sort()).toEqual(["a", "b"])
    expect([...toggleSet(withA, "a")]).toEqual(["b"])
  })
})

describe("buildListQueryInput", () => {
  it("omits empty filters", () => {
    expect(buildListQueryInput(emptyFilters)).toEqual({
      search: undefined,
      domains: undefined,
      difficulties: undefined,
      userStatuses: undefined,
      customOnly: undefined,
      page: 1,
      pageSize: 100,
    })
  })

  it("passes trimmed search, sets, and customOnly", () => {
    expect(
      buildListQueryInput({
        search: "  graph  ",
        selectedDomains: new Set(["coding"]),
        selectedDifficulties: new Set(["hard"]),
        selectedStatuses: new Set(["new"]),
        customOnly: true,
      })
    ).toEqual({
      search: "graph",
      domains: ["coding"],
      difficulties: ["hard"],
      userStatuses: ["new"],
      customOnly: true,
      page: 1,
      pageSize: 100,
    })
  })
})

describe("mapListItemsToBankQuestions", () => {
  it("returns empty for missing items", () => {
    expect(mapListItemsToBankQuestions(undefined)).toEqual([])
  })

  it("maps list rows including isCustom", () => {
    const items: ListQuestionItem[] = [
      {
        id: "1",
        title: "BFS",
        domain: "coding",
        difficulty: "medium",
        company: null,
        status: "new",
        format: "code_run",
        trackHint: "algorithms",
        isCustom: true,
      },
    ]
    expect(mapListItemsToBankQuestions(items)).toEqual([
      {
        id: "1",
        title: "BFS",
        domain: "coding",
        difficulty: "medium",
        company: null,
        status: "new",
        format: "code_run",
        trackHint: "algorithms",
        isCustom: true,
      },
    ])
  })
})

describe("countByField", () => {
  it("counts by domain", () => {
    const questions: BankQuestion[] = [
      {
        id: "1",
        title: "a",
        domain: "coding",
        difficulty: "easy",
        company: null,
        status: "new",
      },
      {
        id: "2",
        title: "b",
        domain: "coding",
        difficulty: "hard",
        company: null,
        status: "attempted",
      },
      {
        id: "3",
        title: "c",
        domain: "behavioral",
        difficulty: "easy",
        company: null,
        status: "new",
      },
    ]
    expect(countByField(questions, (q) => q.domain)).toEqual({
      coding: 2,
      behavioral: 1,
    })
  })
})

describe("computeHasFilters", () => {
  it("is false when nothing selected", () => {
    expect(computeHasFilters(emptyFilters)).toBe(false)
  })

  it("is true for search, sets, or customOnly", () => {
    expect(computeHasFilters({ ...emptyFilters, search: "x" })).toBe(true)
    expect(
      computeHasFilters({
        ...emptyFilters,
        selectedDomains: new Set(["coding"]),
      })
    ).toBe(true)
    expect(computeHasFilters({ ...emptyFilters, customOnly: true })).toBe(true)
  })
})
