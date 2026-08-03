import { describe, expect, it } from "vitest"
import type { AnalysisFinding } from "@/features/resume-editor/lib/general-analysis/types"
import {
  buildResult,
  countBySeverity,
  emptyCounts,
  GRAMMAR_DEDUCTION_CAP,
  SEVERITY_DEDUCTION,
  scoreFindings,
  sortFindings,
} from "@/features/resume-editor/lib/general-analysis/score"

function finding(
  partial: Pick<AnalysisFinding, "id" | "ruleId" | "severity">
): AnalysisFinding {
  return partial
}

describe("emptyCounts / countBySeverity", () => {
  it("starts at zero", () => {
    expect(emptyCounts()).toEqual({
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    })
  })

  it("tallies severities", () => {
    expect(
      countBySeverity([
        finding({ id: "1", ruleId: "missing_name", severity: "critical" }),
        finding({ id: "2", ruleId: "thin_skills", severity: "high" }),
        finding({ id: "3", ruleId: "thin_skills", severity: "high" }),
        finding({ id: "4", ruleId: "summary_too_short", severity: "medium" }),
        finding({ id: "5", ruleId: "grammar_issue", severity: "low" }),
      ])
    ).toEqual({ critical: 1, high: 2, medium: 1, low: 1 })
  })
})

describe("scoreFindings", () => {
  it("returns 100 with no findings", () => {
    expect(scoreFindings([])).toBe(100)
  })

  it("deducts full structural points", () => {
    expect(
      scoreFindings([
        finding({ id: "1", ruleId: "missing_name", severity: "critical" }),
        finding({ id: "2", ruleId: "thin_skills", severity: "high" }),
      ])
    ).toBe(100 - SEVERITY_DEDUCTION.critical - SEVERITY_DEDUCTION.high)
  })

  it("caps grammar deductions", () => {
    const manyGrammar = Array.from({ length: 10 }, (_, i) =>
      finding({
        id: `g${i}`,
        ruleId: "grammar_issue",
        severity: "high",
      })
    )
    // 10 * 8 = 80 uncapped → cap 20
    expect(scoreFindings(manyGrammar)).toBe(100 - GRAMMAR_DEDUCTION_CAP)
  })

  it("floors at 0", () => {
    const heavy = Array.from({ length: 20 }, (_, i) =>
      finding({
        id: `c${i}`,
        ruleId: "missing_experience",
        severity: "critical",
      })
    )
    expect(scoreFindings(heavy)).toBe(0)
  })
})

describe("sortFindings / buildResult", () => {
  it("sorts by severity then id", () => {
    const sorted = sortFindings([
      finding({ id: "b", ruleId: "thin_skills", severity: "high" }),
      finding({ id: "a", ruleId: "missing_name", severity: "critical" }),
      finding({ id: "c", ruleId: "grammar_issue", severity: "low" }),
      finding({ id: "z", ruleId: "thin_skills", severity: "high" }),
    ])
    expect(sorted.map((f) => f.id)).toEqual(["a", "b", "z", "c"])
  })

  it("buildResult wires score, sorted findings, counts", () => {
    const result = buildResult([
      finding({ id: "2", ruleId: "grammar_issue", severity: "low" }),
      finding({ id: "1", ruleId: "missing_email", severity: "critical" }),
    ])
    expect(result.findings.map((f) => f.id)).toEqual(["1", "2"])
    expect(result.countsBySeverity).toEqual({
      critical: 1,
      high: 0,
      medium: 0,
      low: 1,
    })
    expect(result.score).toBe(
      100 - SEVERITY_DEDUCTION.critical - SEVERITY_DEDUCTION.low
    )
  })
})
