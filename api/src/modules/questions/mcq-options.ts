/**
 * Shared MCQ option list normalization (create / generate / practice parse).
 */

/** Trim, stringify, drop empties, cap length. */
export function normalizeMcqOptions(raw: unknown, max = 6): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((o) => (typeof o === "string" ? o.trim() : String(o ?? "").trim()))
    .filter((o) => o.length > 0)
    .slice(0, max)
}

/** Integer indices in [0, optionCount). */
export function filterMcqIndices(raw: unknown, optionCount: number): number[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((n): n is number => typeof n === "number" && Number.isInteger(n))
    .filter((n) => n >= 0 && n < optionCount)
}
