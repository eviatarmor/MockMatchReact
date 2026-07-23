import {
  Sparkles,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  Bookmark,
  MoreHorizontal,
  Send,
  Wand2,
  ArrowUpRight,
  X,
  ExternalLink,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MatchScoreRing } from "./match-score-ring"
import { MATCH_TIER_TEXT_CLASS } from "../constants"
import type { DiscoverJob } from "../types"

interface DiscoverJobCardProps {
  readonly job: DiscoverJob
  readonly onViewDetails: (job: DiscoverJob) => void
}

export function DiscoverJobCard({ job, onViewDetails }: DiscoverJobCardProps) {
  const { t } = useTranslation("common")
  const hasMatch = job.matchScore != null && job.matchTier != null
  const employmentLabel =
    job.employmentType === "unknown"
      ? null
      : t(`discover.employmentTypes.${job.employmentType}`)
  const seniorityLabel =
    job.seniority === "unknown" ? null : job.seniority
  const levelLine = [seniorityLabel, employmentLabel].filter(Boolean).join(" · ")

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold select-none",
              job.avatarColorClass
            )}
          >
            {job.avatarText}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onViewDetails(job)}
                className="cursor-pointer text-left text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                {job.title}
              </button>
              {job.isNew && (
                <Badge variant="default">{t("discover.filters.new")}</Badge>
              )}
              {job.remoteType === "remote" && (
                <Badge variant="secondary">{t("discover.filters.remote")}</Badge>
              )}
              {job.remoteType === "hybrid" && (
                <Badge variant="outline">{t("discover.remoteTypes.hybrid")}</Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{job.company}</span>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="size-3.5" />
                {job.salaryRange}
              </span>
              {levelLine && (
                <span className="flex items-center gap-1 capitalize">
                  <Briefcase className="size-3.5" />
                  {levelLine}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {job.postedAt}
              </span>
            </div>
          </div>
        </div>

        {job.scorePending && !hasMatch && (
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        )}
        {hasMatch && (
          <div className="flex shrink-0 flex-col items-center gap-1">
            <MatchScoreRing score={job.matchScore!} tier={job.matchTier!} />
            <span
              className={cn(
                "text-[11px] font-medium whitespace-nowrap",
                MATCH_TIER_TEXT_CLASS[job.matchTier!]
              )}
            >
              {t(`discover.matchTiers.${job.matchTier}`)}
            </span>
            {job.scoreMode === "heuristic" && (
              <span className="text-[10px] text-muted-foreground">
                {t("discover.fit.basic")}
              </span>
            )}
            {job.scoreMode === "ai" && (
              <span className="text-[10px] text-muted-foreground">
                {t("discover.fit.ai")}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        {(job.fitNote || job.category) && (
          <div className="flex flex-1 items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{job.fitNote ?? job.category}</span>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          <Button size="sm" className="h-8 gap-1.5 cursor-pointer">
            <Bookmark className="size-4" />
            {t("discover.actions.track")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="icon" className="size-8 cursor-pointer" />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {job.applyUrl ? (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => window.open(job.applyUrl, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="size-4" />
                  {t("discover.actions.applyToRole")}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="cursor-pointer">
                  <Send className="size-4" />
                  {t("discover.actions.applyToRole")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="cursor-pointer">
                <Wand2 className="size-4" />
                {t("discover.actions.tailorResume")}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => onViewDetails(job)}>
                <ArrowUpRight className="size-4" />
                {t("discover.actions.viewDetails")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="cursor-pointer">
                <X className="size-4" />
                {t("discover.actions.notInterested")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.map((skill) => (
            <Badge
              key={skill.label}
              variant={skill.matched ? "secondary" : "outline"}
            >
              {skill.matched ? "✓ " : "− "}
              {skill.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
