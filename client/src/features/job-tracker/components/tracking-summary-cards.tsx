import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { TRACKING_STATUS_ORDER } from "../constants"
import type { TrackedJob, TrackingStatus } from "../types"

interface TrackingSummaryCardsProps {
  readonly jobs: TrackedJob[]
}

const STATUS_DOT_CLASS: Record<TrackingStatus, string> = {
  saved: "bg-neutral-400",
  applied: "bg-blue-500",
  interviewing: "bg-amber-500",
  offer: "bg-emerald-500",
}

export function TrackingSummaryCards({ jobs }: TrackingSummaryCardsProps) {
  const { t } = useTranslation("common")

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TRACKING_STATUS_ORDER.map((status) => {
        const count = jobs.filter((job) => job.status === status).length
        return (
          <div key={status} className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", STATUS_DOT_CLASS[status])} />
              <span className="text-sm text-muted-foreground">{t(`jobTracker.summary.${status}`)}</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
