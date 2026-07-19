import { useTranslation } from "react-i18next"
import { ToneBadge, type BadgeTone } from "@/components/data/tone-badge"
import type { TrackingStatus } from "../types"

interface TrackingStatusBadgeProps {
  readonly status: TrackingStatus
}

const STATUS_TONE: Record<TrackingStatus, BadgeTone> = {
  saved: "muted",
  applied: "warning",
  interviewing: "warning",
  offer: "positive",
}

export function TrackingStatusBadge({ status }: TrackingStatusBadgeProps) {
  const { t } = useTranslation("common")

  return <ToneBadge tone={STATUS_TONE[status]}>{t(`jobTracker.statusLabels.${status}`)}</ToneBadge>
}
