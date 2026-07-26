import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  Send,
  Bookmark,
  BookmarkCheck,
  Check,
  DollarSign,
  Briefcase,
  MapPin,
  Clock,
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  Maximize2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  SCORE_BAND_PROGRESS_CLASS,
  SCORE_BAND_TEXT_CLASS,
  scoreBand,
} from "@/lib/score-tier"
import confetti from "canvas-confetti"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { PanelShell } from "@/components/dashboard/panel-shell"
import { useTrackedJobs } from "@/features/applications/hooks/use-tracked-jobs"
import { useFitDocument } from "../hooks/use-fit-document"
import { cacheJobSnapshot, jobDetailPath } from "../lib/job-snapshot"
import { JobShareMenu } from "./job-share-menu"
import type { DiscoverJob } from "../types"

interface JobDetailsPanelProps {
  readonly job: DiscoverJob
  readonly onClose?: () => void
  /**
   * `sheet` = mobile overlay; `pane` = desktop right card;
   * `page` = full job route (no expand control).
   */
  readonly variant?: "sheet" | "pane" | "page"
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
  const navigate = useNavigate()
  const fitDoc = useFitDocument()
  const { isTracked, hasApplied, toggleDiscoverJob, markAppliedFromDiscover } =
    useTrackedJobs()
  /** `first` = mark applied after posting; `again` = re-open posting after already applied. */
  const [applyDialog, setApplyDialog] = useState<"first" | "again" | null>(null)
  const tracked = isTracked(job.id)
  const applied = hasApplied(job.id)
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
  const isPage = variant === "page"
  const showOpenFull = !isPage

  function handleTrackToggle() {
    const nowTracked = toggleDiscoverJob(job)
    if (nowTracked) {
      toast.success(t("discover.details.trackAdded"), {
        description: t("discover.details.trackAddedDescription"),
      })
    } else {
      toast.message(t("discover.details.trackRemoved"))
    }
  }

  function handleOpenFull() {
    cacheJobSnapshot(job)
    onClose?.()
    navigate(jobDetailPath(job.id), {
      state: { job, backTo: "/discover" },
    })
  }

  function openApplyUrl() {
    if (job.applyUrl) {
      window.open(job.applyUrl, "_blank", "noopener,noreferrer")
    }
  }

  function handleApplyClick() {
    if (applied) {
      setApplyDialog("again")
      return
    }
    openApplyUrl()
    setApplyDialog("first")
  }

  function handleConfirmApplied() {
    const changed = markAppliedFromDiscover(job)
    setApplyDialog(null)
    if (changed) {
      void confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        zIndex: 200,
        disableForReducedMotion: true,
      })
      toast.success(t("discover.details.applyMarked"), {
        description: t("discover.details.applyMarkedDescription"),
      })
    } else {
      toast.message(t("discover.details.applyAlreadyMarked"))
    }
  }

  function handleConfirmApplyAgain() {
    setApplyDialog(null)
    openApplyUrl()
    toast.message(t("discover.details.applyAgainOpened"))
  }

  const stats = [
    { icon: DollarSign, labelKey: "discover.details.compensation", value: job.salaryRange },
    { icon: Briefcase, labelKey: "discover.details.level", value: levelValue },
    { icon: MapPin, labelKey: "discover.details.location", value: job.location },
    { icon: Clock, labelKey: "discover.details.posted", value: job.postedAt },
  ].filter((stat) => !isEmptyStatValue(stat.value))

  const description = job.description?.trim() ?? ""

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <PanelShell
        className={isPane || isPage ? "min-h-0 rounded-xl" : "min-h-0"}
        headerClassName="pr-4"
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
            <div className="flex shrink-0 items-center gap-0.5">
              <JobShareMenu job={job} variant="icon" />
              {showOpenFull && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer text-muted-foreground"
                  title={t("discover.details.openFull")}
                  onClick={handleOpenFull}
                >
                  <Maximize2 className="size-4" />
                  <span className="sr-only">{t("discover.details.openFull")}</span>
                </Button>
              )}
              {!isPane && !isPage && onClose && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer text-muted-foreground"
                  onClick={onClose}
                >
                  <X className="size-4" />
                  <span className="sr-only">{t("discover.details.close")}</span>
                </Button>
              )}
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
              <Button
                variant={tracked ? "secondary" : "outline"}
                className={cn(
                  "gap-1.5 cursor-pointer sm:min-w-28",
                  tracked && "text-primary"
                )}
                aria-pressed={tracked}
                onClick={handleTrackToggle}
              >
                {tracked ? (
                  <BookmarkCheck className="size-4" />
                ) : (
                  <Bookmark className="size-4" />
                )}
                {tracked
                  ? t("discover.details.trackingRole")
                  : t("discover.details.trackRole")}
              </Button>
              <Button
                variant={applied ? "secondary" : "default"}
                className={cn(
                  "gap-1.5 cursor-pointer sm:min-w-28",
                  applied && "text-primary"
                )}
                aria-pressed={applied}
                onClick={handleApplyClick}
              >
                {applied ? (
                  <Check className="size-4" />
                ) : job.applyUrl ? (
                  <ExternalLink className="size-4" />
                ) : (
                  <Send className="size-4" />
                )}
                {applied
                  ? t("discover.details.appliedLabel")
                  : t("discover.details.applyNow")}
              </Button>
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

      <Dialog
        open={applyDialog === "first"}
        onOpenChange={(open) => {
          if (!open) setApplyDialog(null)
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>{t("discover.details.applyConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("discover.details.applyConfirmDescription", {
                title: job.title,
                company: job.company,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setApplyDialog(null)}
            >
              {t("discover.details.applyConfirmNo")}
            </Button>
            <Button className="cursor-pointer" onClick={handleConfirmApplied}>
              {t("discover.details.applyConfirmYes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={applyDialog === "again"}
        onOpenChange={(open) => {
          if (!open) setApplyDialog(null)
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>{t("discover.details.applyAgainTitle")}</DialogTitle>
            <DialogDescription>
              {t("discover.details.applyAgainDescription", {
                title: job.title,
                company: job.company,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setApplyDialog(null)}
            >
              {t("discover.details.applyAgainNo")}
            </Button>
            <Button className="cursor-pointer" onClick={handleConfirmApplyAgain}>
              {t("discover.details.applyAgainYes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

