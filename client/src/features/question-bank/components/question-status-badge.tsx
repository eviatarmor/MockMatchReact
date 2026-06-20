import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"
import { ToneBadge } from "@/components/data/tone-badge"
import type { QuestionStatus } from "../types"

interface QuestionStatusBadgeProps {
  readonly status: QuestionStatus
}

export function QuestionStatusBadge({ status }: QuestionStatusBadgeProps) {
  const { t } = useTranslation("common")
  const label = t(`questionBank.status.${status}`)

  if (status === "mastered") {
    return <ToneBadge tone="emerald">{label}</ToneBadge>
  }

  return <Badge variant="secondary">{label}</Badge>
}
