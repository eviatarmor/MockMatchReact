import { useTranslation } from "react-i18next"
import { Wand2, Send, Bookmark, DollarSign, Briefcase, MapPin, Clock, Check, Minus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MatchScoreRing } from "./match-score-ring"
import type { DiscoverJob } from "../types"

interface JobDetailsPanelProps {
  readonly job: DiscoverJob
  readonly onClose: () => void
}

const TIER_TEXT_CLASS = {
  strong: "text-emerald-600",
  good: "text-blue-600",
  fair: "text-amber-600",
} as const

export function JobDetailsPanel({ job, onClose }: JobDetailsPanelProps) {
  const { t } = useTranslation("common")

  const stats = [
    { icon: DollarSign, labelKey: "jobTracker.details.compensation", value: job.salaryRange },
    { icon: Briefcase, labelKey: "jobTracker.details.level", value: job.seniority },
    { icon: MapPin, labelKey: "jobTracker.details.location", value: job.location },
    { icon: Clock, labelKey: "jobTracker.details.posted", value: job.postedAt },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b p-4">
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
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-4 rounded-xl border p-3">
          <MatchScoreRing score={job.matchScore} tier={job.matchTier} showLabel={false} />
          <div className="flex flex-col gap-0.5">
            <span className={cn("text-sm font-semibold", TIER_TEXT_CLASS[job.matchTier])}>
              {t(`jobTracker.matchTiers.${job.matchTier}`)}
            </span>
            <span className="text-sm text-muted-foreground">{job.fitNote}</span>
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
            {t("jobTracker.details.whyYouMatch")}
          </span>
          <ul className="flex flex-col gap-2">
            {job.skills.map((skill) => (
              <li key={skill.label} className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full",
                    skill.matched
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {skill.matched ? <Check className="size-3" /> : <Minus className="size-3" />}
                </span>
                <span className="font-medium text-foreground">{skill.label}</span>
                <span className="text-muted-foreground">
                  {skill.matched
                    ? t("jobTracker.details.inResume")
                    : t("jobTracker.details.considerAdding")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-2 border-t p-4">
        <Button variant="outline" className="flex-1 cursor-pointer" onClick={onClose}>
          {t("jobTracker.details.close")}
        </Button>
        <Button className="flex-1 gap-1.5 cursor-pointer">
          <Bookmark className="size-4" />
          {t("jobTracker.details.trackRole")}
        </Button>
      </div>
    </div>
  )
}
