import { useTranslation } from "react-i18next"
import {
  Wand2,
  Send,
  Bookmark,
  DollarSign,
  Briefcase,
  MapPin,
  Clock,
  Check,
  Minus,
  X,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PanelShell } from "@/components/dashboard/panel-shell"
import { MatchScoreRing } from "./match-score-ring"
import { MATCH_TIER_TEXT_CLASS } from "../constants"
import type { DiscoverJob } from "../types"

interface JobDetailsPanelProps {
  readonly job: DiscoverJob
  readonly onClose: () => void
}

export function JobDetailsPanel({ job, onClose }: JobDetailsPanelProps) {
  const { t } = useTranslation("common")
  const hasMatch = job.matchScore != null && job.matchTier != null
  const employmentLabel =
    job.employmentType === "unknown"
      ? "—"
      : t(`discover.employmentTypes.${job.employmentType}`)
  const levelValue =
    job.seniority === "unknown" ? employmentLabel : `${job.seniority} · ${employmentLabel}`

  const stats = [
    { icon: DollarSign, labelKey: "discover.details.compensation", value: job.salaryRange },
    { icon: Briefcase, labelKey: "discover.details.level", value: levelValue },
    { icon: MapPin, labelKey: "discover.details.location", value: job.location },
    { icon: Clock, labelKey: "discover.details.posted", value: job.postedAt },
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
            <span className="sr-only">{t("discover.details.close")}</span>
          </Button>
        </>
      }
      footer={
        <>
          <Button variant="outline" className="flex-1 cursor-pointer" onClick={onClose}>
            {t("discover.details.close")}
          </Button>
          <Button className="flex-1 gap-1.5 cursor-pointer">
            <Bookmark className="size-4" />
            {t("discover.details.trackRole")}
          </Button>
        </>
      }
    >
      {hasMatch && (
        <div className="flex items-center gap-4 rounded-xl border p-3">
          <MatchScoreRing score={job.matchScore!} tier={job.matchTier!} />
          <div className="flex flex-col gap-0.5">
            <span className={cn("text-sm font-semibold", MATCH_TIER_TEXT_CLASS[job.matchTier!])}>
              {t(`discover.matchTiers.${job.matchTier}`)}
            </span>
            {job.fitNote && (
              <span className="text-sm text-muted-foreground">{job.fitNote}</span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border bg-primary/5 p-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Wand2 className="size-4 text-primary" />
          {t("discover.actions.applyToRole")}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-1.5 cursor-pointer">
            <Wand2 className="size-4" />
            {t("discover.details.tailorDocs")}
          </Button>
          {job.applyUrl ? (
            <Button
              className="flex-1 gap-1.5 cursor-pointer"
              onClick={() => window.open(job.applyUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="size-4" />
              {t("discover.details.applyNow")}
            </Button>
          ) : (
            <Button className="flex-1 gap-1.5 cursor-pointer">
              <Send className="size-4" />
              {t("discover.details.applyNow")}
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {t("discover.details.applyHint")}
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

      {job.description && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("discover.details.description")}
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {job.description}
          </p>
        </div>
      )}

      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("discover.details.whyYouMatch")}
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
                    ? t("discover.details.inResume")
                    : t("discover.details.considerAdding")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PanelShell>
  )
}
