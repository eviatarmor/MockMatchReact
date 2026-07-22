import type {
  AnalysisFinding,
  AnalysisSeverity,
  GeneralAnalysisResult,
  SeverityCounts,
} from "./types"
import { SEVERITY_ORDER } from "./types"

/** Points deducted per finding (structural). */
export const SEVERITY_DEDUCTION: Readonly<Record<AnalysisSeverity, number>> = {
  critical: 15,
  high: 8,
  medium: 4,
  low: 2,
}

/** Max total points grammar/writing findings can strip. */
export const GRAMMAR_DEDUCTION_CAP = 20

export function emptyCounts(): SeverityCounts {
  return { critical: 0, high: 0, medium: 0, low: 0 }
}

export function countBySeverity(findings: readonly AnalysisFinding[]): SeverityCounts {
  let critical = 0
  let high = 0
  let medium = 0
  let low = 0
  for (const f of findings) {
    if (f.severity === "critical") critical += 1
    else if (f.severity === "high") high += 1
    else if (f.severity === "medium") medium += 1
    else low += 1
  }
  return { critical, high, medium, low }
}

/**
 * Score from 100, floor 0. Structural findings use full severity weights;
 * grammar findings (`ruleId === "grammar_issue"`) share a −20 cap.
 */
export function scoreFindings(findings: readonly AnalysisFinding[]): number {
  let structural = 0
  let grammar = 0

  for (const f of findings) {
    const points = SEVERITY_DEDUCTION[f.severity]
    if (f.ruleId === "grammar_issue") {
      grammar += points
    } else {
      structural += points
    }
  }

  const total = structural + Math.min(grammar, GRAMMAR_DEDUCTION_CAP)
  return Math.max(0, 100 - total)
}

export function buildResult(findings: readonly AnalysisFinding[]): GeneralAnalysisResult {
  const sorted = sortFindings(findings)
  return {
    score: scoreFindings(sorted),
    findings: sorted,
    countsBySeverity: countBySeverity(sorted),
  }
}

export function sortFindings(findings: readonly AnalysisFinding[]): AnalysisFinding[] {
  const rank = Object.fromEntries(SEVERITY_ORDER.map((s, i) => [s, i])) as Record<
    AnalysisSeverity,
    number
  >
  return [...findings].sort((a, b) => {
    const bySev = rank[a.severity] - rank[b.severity]
    if (bySev !== 0) return bySev
    return a.id.localeCompare(b.id)
  })
}

/** Band used for badge / status copy. */
export function scoreBand(score: number): "strong" | "ok" | "weak" {
  if (score >= 85) return "strong"
  if (score >= 70) return "ok"
  return "weak"
}
