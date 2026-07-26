import type { GrammarIssue } from "@/lib/grammar/harper"
import { severityForGrammarKind } from "@/lib/grammar/severity"
import type { AnalysisFinding } from "./types"

/** Cap how many individual grammar rows we surface (score already capped separately). */
const MAX_GRAMMAR_FINDINGS = 25

export function grammarFindingsFromIssues(issues: readonly GrammarIssue[]): AnalysisFinding[] {
  return issues.slice(0, MAX_GRAMMAR_FINDINGS).map((issue, index) => ({
    id: `grammar:${index}:${issue.start}-${issue.end}`,
    ruleId: "grammar_issue" as const,
    severity: severityForGrammarKind(issue.kind),
    message: issue.message,
    locationKey: "writing",
  }))
}
