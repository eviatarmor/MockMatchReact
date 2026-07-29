import {
  GRAMMAR_SEVERITY_HEX,
  severityForGrammarKind,
  type GrammarSeverity,
} from "../lib/grammar/severity"

/**
 * Wavy squiggle under Harper issues — same mark for Lexical rich-text fields
 * and plain EditableText overlays. Color matches general-analysis severity.
 */

function squiggleUrl(hex: string): string {
  // Encode # as %23 for data-URI SVG stroke.
  const stroke = hex.replace("#", "%23")
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='4'%3E%3Cpath d='M0 3 Q1.5 0 3 3 T6 3' stroke='${stroke}' fill='none' stroke-width='1'/%3E%3C/svg%3E")`
}

const SQUIGGLE_BY_SEVERITY: Readonly<Record<GrammarSeverity, string>> = {
  critical: squiggleUrl(GRAMMAR_SEVERITY_HEX.critical),
  high: squiggleUrl(GRAMMAR_SEVERITY_HEX.high),
  medium: squiggleUrl(GRAMMAR_SEVERITY_HEX.medium),
  low: squiggleUrl(GRAMMAR_SEVERITY_HEX.low),
}

export const GRAMMAR_SQUIGGLE_SIZE = "6px 4px"

/** Squiggle background-image for a Harper issue kind (spell → amber, else sky). */
export function grammarSquiggleForKind(kind: string): string {
  return SQUIGGLE_BY_SEVERITY[severityForGrammarKind(kind)]
}

/** @deprecated Prefer grammarSquiggleForKind — kept as low (sky) default. */
export const GRAMMAR_SQUIGGLE = SQUIGGLE_BY_SEVERITY.low
