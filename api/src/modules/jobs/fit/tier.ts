import type { FitScore } from "@mockmatch/schemas"

/**
 * Map 0–100 fit score → tier.
 * Low scores must not read as “fair” (e.g. 8 → weak).
 */
export function tierFromScore(score: number): FitScore["tier"] {
  if (score >= 80) return "strong"
  if (score >= 60) return "good"
  if (score >= 40) return "fair"
  return "weak"
}
