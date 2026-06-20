import { useTranslation } from "react-i18next"
import { ToneBadge } from "@/components/data/tone-badge"
import type { BadgeTone } from "@/components/data/badge-tones"
import type { ExerciseStatus } from "../types"

const STATUS_TONES: Record<Exclude<ExerciseStatus, "notStarted">, BadgeTone> = {
  mastered: "emerald",
  inProgress: "amber",
}

interface AssessmentStatusBadgeProps {
  readonly status: ExerciseStatus
}

export function AssessmentStatusBadge({ status }: AssessmentStatusBadgeProps) {
  const { t } = useTranslation("common")

  if (status === "notStarted") {
    return <span className="text-xs text-muted-foreground">{t("assessments.status.notStarted")}</span>
  }

  return <ToneBadge tone={STATUS_TONES[status]}>{t(`assessments.status.${status}`)}</ToneBadge>
}
