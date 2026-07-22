import type { GrammarIssue } from "@/lib/grammar/harper"
import type { AnalysisFinding, AnalysisSeverity } from "./types"

/** Map Harper kind → severity (spelling hurts more than style nits). */
function severityForKind(kind: string): AnalysisSeverity {
  const k = kind.toLowerCase()
  if (k.includes("spell")) return "medium"
  if (k.includes("grammar")) return "low"
  return "low"
}

/** Cap how many individual grammar rows we surface (score already capped separately). */
const MAX_GRAMMAR_FINDINGS = 25

export function grammarFindingsFromIssues(issues: readonly GrammarIssue[]): AnalysisFinding[] {
  return issues.slice(0, MAX_GRAMMAR_FINDINGS).map((issue, index) => ({
    id: `grammar:${index}:${issue.start}-${issue.end}`,
    ruleId: "grammar_issue" as const,
    severity: severityForKind(issue.kind),
    message: issue.message,
    locationKey: "writing",
  }))
}
