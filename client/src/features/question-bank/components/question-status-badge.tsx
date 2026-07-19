import { useTranslation } from "react-i18next"
import { ToneBadge } from "@/components/data/tone-badge"
import type { QuestionStatus } from "../types"

interface QuestionStatusBadgeProps {
  readonly status: QuestionStatus
}

export function QuestionStatusBadge({ status }: QuestionStatusBadgeProps) {
  const { t } = useTranslation("common")
  const label = t(`questionBank.status.${status}`)
  const tone = status === "mastered" ? "positive" : "muted"

  return <ToneBadge tone={tone}>{label}</ToneBadge>
}
