// Single source for the semantic badge color tokens used across features
// (status / difficulty / state pills). Reference BADGE_TONES[tone] instead of
// re-typing the Tailwind class string.
export type BadgeTone = "emerald" | "amber" | "red"

export const BADGE_TONES: Record<BadgeTone, string> = {
  emerald:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
  amber:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
  red: "border-red-400 bg-red-500 text-white dark:border-red-700 dark:bg-red-600",
}
