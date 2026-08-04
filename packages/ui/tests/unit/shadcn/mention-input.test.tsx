import { describe, expect, it } from "vitest"
import {
  mentionDefaultGetQuery,
  mentionFilterSuggestions,
  type MentionSuggestion,
} from "@/shadcn/mention"

const SAMPLE: MentionSuggestion[] = [
  { label: "SUM", value: "SUM(" },
  { label: "SUMIF", value: "SUMIF(" },
  { label: "AVERAGE", value: "AVERAGE(" },
  { label: "IF", value: "IF(" },
]

describe("mentionDefaultGetQuery", () => {
  it("matches after @ trigger", () => {
    expect(mentionDefaultGetQuery("hi @al", 6, "@")).toEqual({
      start: 4,
      end: 6,
      query: "al",
    })
  })

  it("returns null without trigger", () => {
    expect(mentionDefaultGetQuery("hello", 5, "@")).toBeNull()
  })

  it("returns null when space breaks the query", () => {
    expect(mentionDefaultGetQuery("@a b", 4, "@")).toBeNull()
  })
})

describe("mentionFilterSuggestions", () => {
  it("prefers prefix matches", () => {
    const out = mentionFilterSuggestions(SAMPLE, "SU", 10)
    expect(out.map((s) => s.label)).toEqual(["SUM", "SUMIF"])
  })

  it("limits results", () => {
    const out = mentionFilterSuggestions(SAMPLE, "", 2)
    expect(out).toHaveLength(2)
  })
})
