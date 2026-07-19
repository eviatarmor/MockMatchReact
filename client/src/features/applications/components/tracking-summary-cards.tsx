import { TrendingUp, TrendingDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TRACKING_STATUS_ORDER, TRACKING_STATUS_TRENDS } from "../constants"
import type { TrackedJob, TrackingStatus } from "../types"

interface TrackingSummaryCardsProps {
  readonly jobs: TrackedJob[]
  readonly activeFilter: TrackingStatus | null
  readonly onFilterChange: (status: TrackingStatus | null) => void
}

const STATUS_DOT_CLASS: Record<TrackingStatus, string> = {
  saved: "bg-neutral-400",
  applied: "bg-blue-500",
  interviewing: "bg-amber-500",
  offer: "bg-emerald-500",
}

const STATUS_HOVER_BORDER_CLASS: Record<TrackingStatus, string> = {
  saved: "hover:border-neutral-400",
  applied: "hover:border-blue-500",
  interviewing: "hover:border-amber-500",
  offer: "hover:border-emerald-500",
}

const STATUS_ACTIVE_BORDER_CLASS: Record<TrackingStatus, string> = {
  saved: "border-neutral-400",
  applied: "border-blue-500",
  interviewing: "border-amber-500",
  offer: "border-emerald-500",
}

export function TrackingSummaryCards({ jobs, activeFilter, onFilterChange }: TrackingSummaryCardsProps) {
  const { t } = useTranslation("common")

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TRACKING_STATUS_ORDER.map((status) => {
        const count = jobs.filter((job) => job.status === status).length
        const isActive = activeFilter === status
        const trend = TRACKING_STATUS_TRENDS[status]
        const isUp = trend >= 0
        const TrendIcon = isUp ? TrendingUp : TrendingDown
        return (
          <button
            key={status}
            type="button"
            onClick={() => onFilterChange(isActive ? null : status)}
            className={cn(
              "flex flex-col gap-2 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors cursor-pointer",
              STATUS_HOVER_BORDER_CLASS[status],
              isActive && STATUS_ACTIVE_BORDER_CLASS[status]
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", STATUS_DOT_CLASS[status])} />
              <span className="text-sm text-muted-foreground">{t(`jobTracker.summary.${status}`)}</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{count}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("jobTracker.summary.last7days")}</span>
              <Badge variant={isUp ? "secondary" : "destructive"}>
                {isUp ? "+" : ""}
                {trend}%
                <TrendIcon className="size-3.5" />
              </Badge>
            </div>
          </button>
        )
      })}
    </div>
  )
}
