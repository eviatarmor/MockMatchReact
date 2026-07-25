import { useTranslation } from "react-i18next"
import {
  Send,
  Bookmark,
  DollarSign,
  Briefcase,
  MapPin,
  Clock,
  X,
  ExternalLink,
  Sparkles,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PanelShell } from "@/components/dashboard/panel-shell"
import { MatchScoreRing } from "./match-score-ring"
import { MATCH_TIER_TEXT_CLASS } from "../constants"
import { useFitDocument } from "../hooks/use-fit-document"
import type { DiscoverJob } from "../types"

interface JobDetailsPanelProps {
  readonly job: DiscoverJob
  readonly onClose: () => void
}

function isEmptyStatValue(value: string | null | undefined): boolean {
  if (value == null) return true
  const trimmed = value.trim()
  return trimmed === "" || trimmed === "—" || trimmed === "-"
}

export function JobDetailsPanel({ job, onClose }: JobDetailsPanelProps) {
  const { t } = useTranslation("common")
  const fitDoc = useFitDocument()
  const hasMatch = job.matchScore != null && job.matchTier != null
  const employmentLabel =
    job.employmentType === "unknown"
      ? null
      : t(`discover.employmentTypes.${job.employmentType}`)
  const seniorityLabel = job.seniority === "unknown" ? null : job.seniority
  const levelValue = [seniorityLabel, employmentLabel].filter(Boolean).join(" · ")

  const stats = [
    { icon: DollarSign, labelKey: "discover.details.compensation", value: job.salaryRange },
    { icon: Briefcase, labelKey: "discover.details.level", value: levelValue },
    { icon: MapPin, labelKey: "discover.details.location", value: job.location },
    { icon: Clock, labelKey: "discover.details.posted", value: job.postedAt },
  ].filter((stat) => !isEmptyStatValue(stat.value))

  const description = job.description?.trim() ?? ""
  const summary = job.summary?.trim() ?? ""

  return (
    <div className="relative h-full min-h-0">
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-3 right-3 z-30 cursor-pointer"
        onClick={onClose}
      >
        <X className="size-4" />
        <span className="sr-only">{t("discover.details.close")}</span>
      </Button>

      <PanelShell
        header={
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold select-none",
                job.avatarColorClass
              )}
            >
              {job.avatarText}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-heading text-base font-medium text-foreground wrap-break-word">
                {job.title}
              </span>
              <span className="text-sm text-muted-foreground wrap-break-word">
                {[job.company, job.location]
                  .filter((part) => !isEmptyStatValue(part))
                  .join(" · ")}
              </span>
            </div>
          </div>
        }
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 cursor-pointer text-muted-foreground"
                disabled={fitDoc.isFitting}
                title={t("discover.details.fitResumeTitle")}
                onClick={() => fitDoc.fitResume(job)}
              >
                {fitDoc.isFittingResume ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {t("discover.details.fitResume")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 cursor-pointer text-muted-foreground"
                disabled={fitDoc.isFitting}
                title={t("discover.details.fitCoverLetterTitle")}
                onClick={() => fitDoc.fitCoverLetter(job)}
              >
                {fitDoc.isFittingCoverLetter ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {t("discover.details.fitCoverLetter")}
              </Button>
            </div>
            <div className="ml-auto flex min-w-0 flex-1 justify-end gap-2">
              <Button variant="outline" className="gap-1.5 cursor-pointer sm:min-w-28">
                <Bookmark className="size-4" />
                {t("discover.details.trackRole")}
              </Button>
              {job.applyUrl ? (
                <Button
                  className="gap-1.5 cursor-pointer sm:min-w-28"
                  onClick={() => window.open(job.applyUrl, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="size-4" />
                  {t("discover.details.applyNow")}
                </Button>
              ) : (
                <Button className="gap-1.5 cursor-pointer sm:min-w-28">
                  <Send className="size-4" />
                  {t("discover.details.applyNow")}
                </Button>
              )}
            </div>
          </div>
        }
      >
        {hasMatch && (
          <div className="flex items-center gap-4 rounded-xl border p-3">
            <MatchScoreRing score={job.matchScore!} tier={job.matchTier!} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className={cn("text-sm font-semibold", MATCH_TIER_TEXT_CLASS[job.matchTier!])}>
                {t(`discover.matchTiers.${job.matchTier}`)}
              </span>
              {job.fitNote && (
                <span className="text-sm text-muted-foreground">{job.fitNote}</span>
              )}
            </div>
          </div>
        )}

        {stats.length > 0 && (
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
        )}

        {summary && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t("discover.details.summary")}
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
          </div>
        )}

        {description && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t("discover.details.description")}
            </span>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {description}
            </p>
          </div>
        )}

        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t("discover.details.skillsRequired")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <Badge key={skill.label} variant="secondary">
                  {skill.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </PanelShell>
    </div>
  )
}
