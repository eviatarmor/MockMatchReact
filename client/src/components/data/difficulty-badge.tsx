import { useTranslation } from "react-i18next"
import { ToneBadge } from "./tone-badge"
import type { BadgeTone } from "./badge-tones"

type Difficulty = "easy" | "medium" | "hard"

const DIFFICULTY_TONES: Record<Difficulty, BadgeTone> = {
  easy: "emerald",
  medium: "amber",
  hard: "red",
}

interface DifficultyBadgeProps {
  readonly difficulty: Difficulty
  // i18n key prefix, e.g. "assessments.difficulty" -> "assessments.difficulty.easy"
  readonly translationPrefix: string
}

export function DifficultyBadge({ difficulty, translationPrefix }: DifficultyBadgeProps) {
  const { t } = useTranslation("common")
  return <ToneBadge tone={DIFFICULTY_TONES[difficulty]}>{t(`${translationPrefix}.${difficulty}`)}</ToneBadge>
}
