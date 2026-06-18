import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import type { ExerciseStatus } from "../types"

const STATUS_CLASSES: Record<ExerciseStatus, string> = {
  mastered: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
  inProgress: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
  notStarted: "",
}

interface AssessmentStatusBadgeProps {
  readonly status: ExerciseStatus
}

export function AssessmentStatusBadge({ status }: AssessmentStatusBadgeProps) {
  const { t } = useTranslation("common")

  if (status === "notStarted") {
    return <span className="text-xs text-muted-foreground">{t("assessments.status.notStarted")}</span>
  }

  return (
    <Badge variant="outline" className={STATUS_CLASSES[status]}>
      {t(`assessments.status.${status}`)}
    </Badge>
  )
}
