import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import type { QuestionStatus } from "../types"

const STATUS_CLASSES: Record<QuestionStatus, string> = {
  mastered: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
  attempted: "",
  new: "",
}

const STATUS_VARIANTS: Record<QuestionStatus, "outline" | "secondary"> = {
  mastered: "outline",
  attempted: "secondary",
  new: "secondary",
}

interface QuestionStatusBadgeProps {
  readonly status: QuestionStatus
}

export function QuestionStatusBadge({ status }: QuestionStatusBadgeProps) {
  const { t } = useTranslation("common")
  return (
    <Badge variant={STATUS_VARIANTS[status]} className={STATUS_CLASSES[status]}>
      {t(`questionBank.status.${status}`)}
    </Badge>
  )
}
