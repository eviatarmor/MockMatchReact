import { useTranslation } from "react-i18next"
import {
  Wand2,
  Send,
  Workflow,
  ExternalLink,
  DollarSign,
  Briefcase,
  MapPin,
  Clock,
  Check,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PanelShell } from "@/components/dashboard/panel-shell"
import { MatchScoreRing } from "../../job-tracker/components/match-score-ring"
import { TRACKING_STATUS_ORDER } from "../constants"
import type { TrackedJob, TrackingStatus } from "../types"

interface TrackedJobDetailsPanelProps {
  readonly job: TrackedJob
  readonly onClose: () => void
}

const STAGE_ICON: Record<TrackingStatus, typeof Check> = {
  saved: Check,
  applied: Check,
  interviewing: MessageSquare,
  offer: Sparkles,
}

const TIER_TEXT_CLASS = {
  strong: "text-emerald-600",
  good: "text-blue-600",
  fair: "text-amber-600",
} as const

function ApplicationStage({ status }: { readonly status: TrackingStatus }) {
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
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                isActive && "bg-amber-500 text-white",
                isCompleted && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="size-3" />
              {t(`jobTracker.statusLabels.${stage}`)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function TrackedJobDetailsPanel({ job, onClose }: TrackedJobDetailsPanelProps) {
  const { t } = useTranslation("common")

  const stats = [
    { icon: DollarSign, labelKey: "jobTracker.details.compensation", value: job.salaryRange },
    { icon: Briefcase, labelKey: "jobTracker.details.level", value: job.seniority },
    { icon: MapPin, labelKey: "jobTracker.details.location", value: job.location },
    { icon: Clock, labelKey: "jobTracker.details.posted", value: job.postedAt },
  ]

  return (
    <PanelShell
      header={
        <>
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold select-none",
              job.avatarColorClass
            )}
          >
            {job.avatarText}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-heading text-base font-medium text-foreground">
              {job.title}
            </span>
            <span className="truncate text-sm text-muted-foreground">
              {job.company} · {job.location}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto shrink-0 cursor-pointer"
            onClick={onClose}
          >
            <X className="size-4" />
            <span className="sr-only">{t("jobTracker.details.close")}</span>
          </Button>
        </>
      }
      footer={
        <>
          <Button variant="outline" className="flex-1 gap-1.5 cursor-pointer" onClick={onClose}>
            <Workflow className="size-4" />
            {t("jobTracker.details.openWorkflow")}
          </Button>
          <Button className="flex-1 gap-1.5 cursor-pointer">
            <ExternalLink className="size-4" />
            {t("jobTracker.details.viewPosting")}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-4 rounded-xl border p-3">
        <MatchScoreRing score={job.matchScore} tier={job.matchTier} showLabel={false} />
        <div className="flex flex-col gap-0.5">
          <span className={cn("text-sm font-semibold", TIER_TEXT_CLASS[job.matchTier])}>
            {t(`jobTracker.matchTiers.${job.matchTier}`)}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("jobTracker.details.scoredNote")}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border bg-primary/5 p-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Wand2 className="size-4 text-primary" />
          {t("jobTracker.actions.applyToRole")}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-1.5 cursor-pointer">
            <Wand2 className="size-4" />
            {t("jobTracker.details.tailorDocs")}
          </Button>
          <Button className="flex-1 gap-1.5 cursor-pointer">
            <Send className="size-4" />
            {t("jobTracker.details.applyNow")}
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          {t("jobTracker.details.applyHint")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div key={stat.labelKey} className="flex flex-col gap-1 rounded-xl border p-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <stat.icon className="size-3.5" />
              {t(stat.labelKey)}
            </span>
            <span className="text-sm font-medium text-foreground capitalize">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t("jobTracker.details.applicationStage")}
        </span>
        <ApplicationStage status={job.status} />
      </div>
    </PanelShell>
  )
}
