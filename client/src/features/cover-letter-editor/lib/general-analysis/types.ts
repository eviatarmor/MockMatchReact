export type AnalysisSeverity = "critical" | "high" | "medium" | "low"

export type AnalysisRuleId =
  | "missing_name"
  | "missing_email"
  | "missing_phone"
  | "invalid_email"
  | "invalid_phone"
  | "missing_location"
  | "missing_linkedin"
  | "missing_company"
  | "missing_date"
  | "missing_greeting"
  | "missing_body"
  | "body_too_short"
  | "missing_signoff"
  | "incomplete_signoff"
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
  readonly blockId?: string
  /**
   * Selector key for click-to-focus — matches `data-analysis-target` on canvas.
   * Examples: `sender:name`, `sender:contact:mail`, `recipient:company`, block UUID.
   */
  readonly focusTarget?: string
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
