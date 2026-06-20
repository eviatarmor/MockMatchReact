import { useTranslation } from "react-i18next"
import { Bookmark, Send, MessageSquare, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { TRACKING_STATUS_ORDER } from "@/features/job-tracker/constants"
import type { TrackingStatus } from "@/features/job-tracker/types"

interface PipelineStatusProps {
  readonly status: TrackingStatus
}

const STAGE_ICON: Record<TrackingStatus, typeof Bookmark> = {
  saved: Bookmark,
  applied: Send,
  interviewing: MessageSquare,
  offer: Sparkles,
}

export function PipelineStatus({ status }: PipelineStatusProps) {
  const { t } = useTranslation("common")
  const currentIndex = TRACKING_STATUS_ORDER.indexOf(status)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TRACKING_STATUS_ORDER.map((stage, index) => {
        const isCompleted = index < currentIndex
        const isActive = index === currentIndex
        const Icon = STAGE_ICON[stage]

        return (
          <div key={stage} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-muted-foreground">—</span>}
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
                isActive && "bg-foreground text-background",
                isCompleted && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {t(`applications.statusLabels.${stage}`)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
