import {
  Code2,
  Monitor,
  Scan,
  Network,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  AlignJustify,
  Clock,
  Play,
  RotateCcw,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { AssessmentDifficultyBadge } from "./assessment-difficulty-badge"
import { AssessmentStatusBadge } from "./assessment-status-badge"
import type { Assessment } from "../types"

const ICON_MAP: Record<string, LucideIcon> = {
  Code2, Monitor, Scan, Network, MessageSquare, TrendingDown, TrendingUp, Lightbulb,
}

interface AssessmentCardProps {
  readonly assessment: Assessment
}

export function AssessmentCard({ assessment }: AssessmentCardProps) {
  const { t } = useTranslation("common")
  const Icon = ICON_MAP[assessment.iconName] ?? AlignJustify

  const isNotStarted = assessment.status === "notStarted"
  const isInProgress = assessment.status === "inProgress"

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <AssessmentDifficultyBadge difficulty={assessment.difficulty} />
      </div>

      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold leading-snug">{assessment.title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t(`assessments.domains.${assessment.domain}`)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {assessment.durationMin} min
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <AssessmentStatusBadge status={assessment.status} />
        {assessment.bestScore !== null && (
          <span className="text-xs text-muted-foreground">
            {t("assessments.best")} <span className="font-semibold text-foreground">{assessment.bestScore}</span>
          </span>
        )}
      </div>

      <Button
        variant={isNotStarted ? "default" : "outline"}
        className="h-8 w-full gap-2 cursor-pointer"
      >
        {isNotStarted ? (
          <>
            <Play className="size-3.5" />
            {t("assessments.actions.start")}
          </>
        ) : isInProgress ? (
          <>
            <Play className="size-3.5" />
            {t("assessments.actions.continue")}
          </>
        ) : (
          <>
            <RotateCcw className="size-3.5" />
            {t("assessments.actions.retry")}
          </>
        )}
      </Button>
    </div>
  )
}
