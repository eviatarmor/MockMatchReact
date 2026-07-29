/**
 * Grammar-issue severity aligned with general-analysis severity palette.
 * Spelling costs more than grammar/style nits (same mapping as analysis findings).
 */
export type GrammarSeverity = "critical" | "high" | "medium" | "low"

/** Map Harper `lint_kind()` → analysis severity. */
export function severityForGrammarKind(kind: string): GrammarSeverity {
  const k = kind.toLowerCase()
  if (k.includes("spell")) return "medium"
  if (k.includes("grammar")) return "low"
  return "low"
}

/**
 * Tailwind 500 hex — matches `SEVERITY_DOT` in general-analysis panels
 * (rose / orange / amber / sky).
 */
export const GRAMMAR_SEVERITY_HEX: Readonly<Record<GrammarSeverity, string>> = {
  critical: "#f43f5e", // rose-500
  high: "#f97316", // orange-500
  medium: "#f59e0b", // amber-500
  low: "#0ea5e9", // sky-500
}

/** Popover kind label classes — matches analysis `SEVERITY_LABEL`. */
export const GRAMMAR_SEVERITY_LABEL_CLASS: Readonly<Record<GrammarSeverity, string>> = {
  critical: "text-rose-700 dark:text-rose-300",
  high: "text-orange-700 dark:text-orange-300",
  medium: "text-amber-800 dark:text-amber-300",
  low: "text-sky-700 dark:text-sky-300",
}
