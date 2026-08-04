import { HyperFormula } from "hyperformula"
import type {
  MentionQueryMatch,
  MentionSuggestion,
} from "@mockmatch/ui/mention"

/** Chars that can precede a function name token inside a formula. */
const FN_PREFIX = /[=(,\s;:+\-*/^&<>!]/

let cachedNames: readonly string[] | null = null
let cachedNameSet: ReadonlySet<string> | null = null
let cachedSuggestions: readonly MentionSuggestion[] | null = null

/**
 * Registered HyperFormula function names, sorted.
 * Built once per process from an empty engine instance.
 */
export function getFormulaFunctionNames(): readonly string[] {
  if (cachedNames) return cachedNames
  const hf = HyperFormula.buildEmpty({ licenseKey: "gpl-v3" })
  try {
    const names = hf
      .getRegisteredFunctionNames()
      .filter((n) => typeof n === "string" && n.length > 0)
      .slice()
      .sort((a, b) => a.localeCompare(b))
    cachedNames = names
    return names
  } finally {
    hf.destroy()
  }
}

/** Uppercase set for syntax highlighting. */
export function getFormulaFunctionNameSet(): ReadonlySet<string> {
  if (cachedNameSet) return cachedNameSet
  cachedNameSet = new Set(
    getFormulaFunctionNames().map((n) => n.toUpperCase())
  )
  return cachedNameSet
}

/** Suggestions for {@link useMention}: insert `NAME(`. */
export function getFormulaFunctionSuggestions(): readonly MentionSuggestion[] {
  if (cachedSuggestions) return cachedSuggestions
  cachedSuggestions = getFormulaFunctionNames().map((name) => ({
    id: name,
    label: name,
    value: `${name}(`,
    description: "Function",
  }))
  return cachedSuggestions
}

/**
 * Active function-name token while editing a formula (`=`…).
 *
 * - Opens while typing a name after `=` / operators / `(`, …
 * - Empty query only right after leading `=` (browse all functions)
 * - Does **not** open with empty query after `(` (so accepting `SUM(` closes list)
 */
export function getFormulaFunctionQuery(
  value: string,
  caret: number
): MentionQueryMatch | null {
  if (!value.startsWith("=")) return null
  if (caret < 1 || caret > value.length) return null

  let start = caret
  while (start > 1 && /[A-Za-z0-9_.]/.test(value.charAt(start - 1))) {
    start -= 1
  }

  const before = start > 0 ? value.charAt(start - 1) : ""
  if (start === 1) {
    if (value.charAt(0) !== "=") return null
  } else if (!FN_PREFIX.test(before)) {
    return null
  }

  const query = value.slice(start, caret)

  // Digits-only → number literal, not a function
  if (query.length > 0 && /^[0-9.]+$/.test(query)) return null

  // Empty token: only when immediately after `=` (e.g. just typed `=`)
  // Not after `(` / `,` / `+` — that would re-open the full list after SUM(
  if (query.length === 0) {
    if (before !== "=") return null
  } else if (!/^[A-Za-z]/.test(query)) {
    // Must start with a letter to be a function name
    return null
  }

  return { start, end: caret, query }
}
