import type { McqQuestion, McqVariant } from "./types"

export function variantOf(q: McqQuestion): McqVariant {
  return q.variant ?? "single"
}

export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"] as const
