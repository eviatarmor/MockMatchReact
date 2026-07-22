export type AnalysisSeverity = "critical" | "high" | "medium" | "low"

export type AnalysisRuleId =
  | "missing_name"
  | "missing_email"
  | "missing_phone"
  | "invalid_email"
  | "invalid_phone"
  | "missing_location"
  | "missing_linkedin"
  | "missing_experience"
  | "missing_education"
  | "missing_skills"
  | "missing_summary"
  | "summary_too_short"
  | "empty_experience_bullets"
  | "incomplete_experience_entry"
  | "incomplete_education_entry"
  | "thin_skills"
  | "no_metrics_in_experience"
  | "grammar_issue"

/** Single job-agnostic finding (structural or writing). */
export interface AnalysisFinding {
  readonly id: string
  readonly ruleId: AnalysisRuleId
  readonly severity: AnalysisSeverity
  /** i18n key under `analysis.findings.*` — grammar uses free-text `message` instead. */
  readonly messageKey?: string
  readonly messageParams?: Readonly<Record<string, string | number>>
  /** Harper (or other) free-form message when no i18n key. */
  readonly message?: string
  readonly sectionId?: string
  readonly entryId?: string
  /** Optional location label key under `analysis.locations.*`. */
  readonly locationKey?: string
}

export interface SeverityCounts {
  readonly critical: number
  readonly high: number
  readonly medium: number
  readonly low: number
}

export interface GeneralAnalysisResult {
  readonly score: number
  readonly findings: readonly AnalysisFinding[]
  readonly countsBySeverity: SeverityCounts
}

export const SEVERITY_ORDER: readonly AnalysisSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
]
