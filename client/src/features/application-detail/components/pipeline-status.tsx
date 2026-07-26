import { useTranslation } from "react-i18next"
import {
  Bookmark,
  Send,
  MessageSquare,
  Sparkles,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TRACKING_PIPELINE_ORDER } from "@/features/discover/constants"
import type { TrackingStatus } from "@/features/discover/types"

interface PipelineStatusProps {
  readonly status: TrackingStatus
}

const STAGE_ICON = {
  saved: Bookmark,
  applied: Send,
  interviewing: MessageSquare,
  offer: Sparkles,
} as const

export function PipelineStatus({ status }: PipelineStatusProps) {
  const { t } = useTranslation("common")
  const isDeclined = status === "declined"
  const currentIndex = isDeclined
    ? -1
    : TRACKING_PIPELINE_ORDER.findIndex((stage) => stage === status)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TRACKING_PIPELINE_ORDER.map((stage, index) => {
        const isCompleted = !isDeclined && index < currentIndex
        const isActive = !isDeclined && index === currentIndex
        const Icon = STAGE_ICON[stage]

        return (
          <div key={stage} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-muted-foreground">—</span>}
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
                isActive && "bg-foreground text-background",
                isCompleted &&
                  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
                !isActive && !isCompleted && "bg-muted text-muted-foreground",
                isDeclined && "opacity-50"
              )}
            >
              <Icon className="size-3.5" />
              {t(`applications.statusLabels.${stage}`)}
            </span>
          </div>
        )
      })}

      {isDeclined ? (
        <>
          <span className="text-muted-foreground">—</span>
          <span className="flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1.5 text-sm font-medium text-white">
            <XCircle className="size-3.5" />
            {t("applications.statusLabels.declined")}
          </span>
        </>
      ) : null}
    </div>
  )
}
