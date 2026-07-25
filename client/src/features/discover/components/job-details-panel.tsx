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
import {
  SCORE_BAND_PROGRESS_CLASS,
  SCORE_BAND_TEXT_CLASS,
  scoreBand,
} from "@/lib/score-tier"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { PanelShell } from "@/components/dashboard/panel-shell"
import { useFitDocument } from "../hooks/use-fit-document"
import type { DiscoverJob } from "../types"

interface JobDetailsPanelProps {
  readonly job: DiscoverJob
  readonly onClose?: () => void
  /** `sheet` = mobile overlay; `pane` = desktop right card. */
  readonly variant?: "sheet" | "pane"
}

function isEmptyStatValue(value: string | null | undefined): boolean {
  if (value == null) return true
  const trimmed = value.trim()
  return trimmed === "" || trimmed === "—" || trimmed === "-"
}

export function JobDetailsPanel({
  job,
  onClose,
  variant = "sheet",
}: JobDetailsPanelProps) {
  const { t } = useTranslation("common")
  const fitDoc = useFitDocument()
  const hasMatch = job.matchScore != null
  const scoreBandKey =
    job.matchScore != null ? scoreBand(job.matchScore) : null
  const employmentLabel =
    job.employmentType === "unknown"
      ? null
      : t(`discover.employmentTypes.${job.employmentType}`)
  const seniorityLabel = job.seniority === "unknown" ? null : job.seniority
  const levelValue = [seniorityLabel, employmentLabel].filter(Boolean).join(" · ")
  const isPane = variant === "pane"

  const stats = [
    { icon: DollarSign, labelKey: "discover.details.compensation", value: job.salaryRange },
    { icon: Briefcase, labelKey: "discover.details.level", value: levelValue },
    { icon: MapPin, labelKey: "discover.details.location", value: job.location },
    { icon: Clock, labelKey: "discover.details.posted", value: job.postedAt },
  ].filter((stat) => !isEmptyStatValue(stat.value))

  const description = job.description?.trim() ?? ""

  return (
    <div className="relative h-full min-h-0">
      {!isPane && onClose && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3 z-30 cursor-pointer"
          onClick={onClose}
        >
          <X className="size-4" />
          <span className="sr-only">{t("discover.details.close")}</span>
        </Button>
      )}

      <PanelShell
        className={isPane ? "rounded-xl" : undefined}
        headerClassName={isPane ? "pr-4" : undefined}
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
        {/* ATS score + progress (resume-editor general analysis pattern) */}
        {(hasMatch || job.scorePending) && (
          <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2.5">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {t("discover.atsScoreLabel")}
                </p>
                {hasMatch && scoreBandKey ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {t(`discover.scoreBands.${scoreBandKey}`)}
                    {job.fitNote ? ` · ${job.fitNote}` : ""}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("discover.details.scoring")}
                  </p>
                )}
              </div>
              {job.scorePending && !hasMatch ? (
                <Loader2
                  className="size-4 shrink-0 animate-spin text-muted-foreground"
                  aria-label={t("discover.details.scoring")}
                />
              ) : hasMatch && scoreBandKey ? (
                <span
                  className={cn(
                    "text-base font-semibold tabular-nums",
                    SCORE_BAND_TEXT_CLASS[scoreBandKey]
                  )}
                >
                  {job.matchScore}
                </span>
              ) : null}
            </div>
            {hasMatch ? (
              <div
                className={cn(
                  "w-full",
                  SCORE_BAND_PROGRESS_CLASS[scoreBand(job.matchScore!)]
                )}
              >
                <Progress value={job.matchScore!} className="w-full gap-0" />
              </div>
            ) : (
              <Skeleton className="h-1 w-full rounded-full" />
            )}
          </div>
        )}

        {stats.length > 0 && (
          <div
            className={cn(
              "grid gap-1.5",
              stats.length >= 4
                ? "grid-cols-2 sm:grid-cols-4"
                : stats.length === 3
                  ? "grid-cols-3"
                  : "grid-cols-2"
            )}
          >
            {stats.map((stat) => (
              <div
                key={stat.labelKey}
                className="flex min-w-0 flex-col gap-0.5 rounded-lg border px-2.5 py-2"
              >
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <stat.icon className="size-3 shrink-0" />
                  <span className="truncate">{t(stat.labelKey)}</span>
                </span>
                <span className="truncate text-xs font-medium text-foreground capitalize">
                  {stat.value}
                </span>
              </div>
            ))}
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

