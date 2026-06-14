import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { TrackingStatus } from "../types"

interface TrackingStatusBadgeProps {
  readonly status: TrackingStatus
}

const STATUS_CLASS: Record<TrackingStatus, string> = {
  saved: "text-neutral-500",
  applied: "text-blue-600",
  interviewing: "text-amber-600",
  offer: "text-emerald-600",
}

const STATUS_DOT_CLASS: Record<TrackingStatus, string> = {
  saved: "bg-neutral-400",
  applied: "bg-blue-500",
  interviewing: "bg-amber-500",
  offer: "bg-emerald-500",
}

export function TrackingStatusBadge({ status }: TrackingStatusBadgeProps) {
  const { t } = useTranslation("common")

  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-medium", STATUS_CLASS[status])}>
      <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASS[status])} />
      {t(`jobTracker.statusLabels.${status}`)}
    </div>
  )
}
