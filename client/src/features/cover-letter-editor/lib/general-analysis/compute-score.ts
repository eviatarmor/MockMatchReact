import type { Dialect } from "harper.js"
import { lintText } from "@/lib/grammar/harper"
import { analyzeStructure } from "./rules"
import { collectPlainText } from "./collect-text"
import { grammarFindingsFromIssues } from "./grammar"
import { buildResult } from "./score"
import type { CoverLetterDocument } from "../../types"

/**
 * Same pipeline as `useGeneralAnalysis`: structural rules + Harper grammar → 0–100.
 * Used when persisting list scores so lab matches editor panel.
 */
export async function computeCoverLetterGeneralScore(
  document: CoverLetterDocument,
  dialect: Dialect
): Promise<number> {
  const structural = analyzeStructure(document)
  const plainText = collectPlainText(document)
  let grammarFindings = grammarFindingsFromIssues([])
  try {
    const issues = await lintText(plainText, { dialect })
    grammarFindings = grammarFindingsFromIssues(issues)
  } catch {
    // Grammar optional — still return structural score.
  }
  return buildResult([...structural, ...grammarFindings]).score
}
