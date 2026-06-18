import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import type { AssessmentDifficulty } from "../types"

const DIFFICULTY_CLASSES: Record<AssessmentDifficulty, string> = {
  easy: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
  medium: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
  hard: "border-red-400 bg-red-500 text-white dark:border-red-700 dark:bg-red-600",
}

interface AssessmentDifficultyBadgeProps {
  readonly difficulty: AssessmentDifficulty
}

export function AssessmentDifficultyBadge({ difficulty }: AssessmentDifficultyBadgeProps) {
  const { t } = useTranslation("common")
  return (
    <Badge variant="outline" className={DIFFICULTY_CLASSES[difficulty]}>
      {t(`assessments.difficulty.${difficulty}`)}
    </Badge>
  )
}
