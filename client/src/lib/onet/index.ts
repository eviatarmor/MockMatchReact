import skillsRaw from "@/data/onet/skills.json"
import type { OnetSuggestion } from "./types"

export type { OnetSuggestion, OnetDatasetId } from "./types"

const SKILLS: readonly OnetSuggestion[] = (skillsRaw as OnetSuggestion[]).map(
  (s) => ({
    value: s.value,
    category: s.category,
  })
)

const SKILL_VALUES: readonly string[] = SKILLS.map((s) => s.value)

/** O\*NET basic/cross-functional + common tech skill labels. */
export function getSkillOptions(): readonly string[] {
  return SKILL_VALUES
}

/** Full skill rows (with optional category). */
export function getSkillSuggestions(): readonly OnetSuggestion[] {
  return SKILLS
}

/**
 * Lightweight client-side filter. Prefer FreeformAutocomplete’s built-in
 * filter for UI; use this for previews / offline search.
 */
export function filterSuggestions(
  options: readonly string[],
  query: string,
  limit = 12
): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return options.slice(0, limit)

  const starts: string[] = []
  const contains: string[] = []
  for (const opt of options) {
    const lower = opt.toLowerCase()
    if (lower.startsWith(q)) starts.push(opt)
    else if (lower.includes(q)) contains.push(opt)
    if (starts.length + contains.length >= limit * 3) break
  }
  return [...starts, ...contains].slice(0, limit)
}
