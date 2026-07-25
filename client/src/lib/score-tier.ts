/**
 * Shared general-score bands — must match resume/cover-letter editor
 * general analysis panel (`scoreTone` / `progressIndicatorTone`).
 *
 * - strong ≥ 85 → emerald
 * - ok     ≥ 70 → amber
 * - weak   < 70 → rose
 */

export type ScoreBand = "strong" | "ok" | "weak"

export function scoreBand(score: number): ScoreBand {
  if (score >= 85) return "strong"
  if (score >= 70) return "ok"
  return "weak"
}

/** Text color for the numeric score (editor panel + lab badge). */
export const SCORE_BAND_TEXT_CLASS: Readonly<Record<ScoreBand, string>> = {
  strong: "text-emerald-600 dark:text-emerald-400",
  ok: "text-amber-600 dark:text-amber-400",
  weak: "text-rose-600 dark:text-rose-400",
}

/** Soft filled badge surface matching the same bands. */
export const SCORE_BAND_BADGE_CLASS: Readonly<Record<ScoreBand, string>> = {
  strong:
    "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  ok: "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-400",
  weak: "border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-400",
}

/** Progress bar indicator (editor panel). */
export const SCORE_BAND_PROGRESS_CLASS: Readonly<Record<ScoreBand, string>> = {
  strong: "[&_[data-slot=progress-indicator]]:bg-emerald-500",
  ok: "[&_[data-slot=progress-indicator]]:bg-amber-500",
  weak: "[&_[data-slot=progress-indicator]]:bg-rose-500",
}
