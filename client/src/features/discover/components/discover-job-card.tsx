import { useState } from "react"
import {
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

function isEmptyMeta(value: string | null | undefined): boolean {
  if (value == null) return true
  const trimmed = value.trim()
  return trimmed === "" || trimmed === "—" || trimmed === "-"
}

export function DiscoverJobCard({ job, onViewDetails }: DiscoverJobCardProps) {
  const { t } = useTranslation("common")
  const [menuOpen, setMenuOpen] = useState(false)
  const hasMatch = job.matchScore != null && job.matchTier != null
  const employmentLabel =
    job.employmentType === "unknown"
      ? null
      : t(`discover.employmentTypes.${job.employmentType}`)
  const seniorityLabel =
    job.seniority === "unknown" ? null : job.seniority
  const levelLine = [seniorityLabel, employmentLabel].filter(Boolean).join(" · ")
  const description = job.description?.trim() ?? ""
  const cardBlurb = job.summary?.trim() || ""
  const showScore = hasMatch || job.scorePending

  const meta = [
    !isEmptyMeta(job.location) && {
      key: "location",
      icon: MapPin,
      label: job.location,
    },
    !isEmptyMeta(job.salaryRange) && {
      key: "salary",
      icon: DollarSign,
      label: job.salaryRange,
    },
    levelLine && {
      key: "level",
      icon: Briefcase,
      label: levelLine,
      capitalize: true,
    },
    !isEmptyMeta(job.postedAt) && {
      key: "posted",
      icon: Clock,
      label: job.postedAt,
    },
  ].filter(Boolean) as Array<{
    key: string
    icon: typeof MapPin
    label: string
    capitalize?: boolean
  }>

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary",
        // Score top-right; hover actions bottom-right
        showScore && "pr-24",
        menuOpen && "z-20"
      )}
    >
      {/* Match score — top right */}
      {job.scorePending && !hasMatch && (
        <div className="absolute top-3 right-3 z-10 flex flex-col items-center gap-1.5">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-2.5 w-14" />
        </div>
      )}
      {hasMatch && (
        <div className="absolute top-3 right-3 z-10 flex flex-col items-center gap-1">
          <MatchScoreRing score={job.matchScore!} tier={job.matchTier!} />
          <span
            className={cn(
              "text-[11px] font-medium whitespace-nowrap",
              MATCH_TIER_TEXT_CLASS[job.matchTier!]
            )}
          >
            {t(`discover.matchTiers.${job.matchTier}`)}
          </span>
        </div>
      )}

      {/* Track + more — bottom right on hover */}
      <div
        className={cn(
          "pointer-events-none absolute right-3 bottom-3 z-10 flex items-center gap-1.5 opacity-0 transition-opacity",
          "group-hover:pointer-events-auto group-hover:opacity-100",
          "group-focus-within:pointer-events-auto group-focus-within:opacity-100",
          menuOpen && "pointer-events-auto opacity-100"
        )}
      >
        <Button size="sm" className="h-8 gap-1.5 cursor-pointer shadow-sm">
          <Bookmark className="size-4" />
          {t("discover.actions.track")}
        </Button>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="size-8 cursor-pointer bg-card shadow-sm"
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" sideOffset={6} className="min-w-44">
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

      <div className="flex min-w-0 items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold select-none",
            job.avatarColorClass
          )}
        >
          {job.avatarText}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
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
          {meta.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {meta.map((item) => (
                <span
                  key={item.key}
                  className={cn("flex items-center gap-1", item.capitalize && "capitalize")}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {cardBlurb ? (
        <p
          className={cn(
            "text-sm leading-relaxed text-muted-foreground",
            job.summaryPending && "opacity-80"
          )}
        >
          {cardBlurb}
        </p>
      ) : description ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {description}
        </p>
      ) : null}

      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pr-28">
          {job.skills.map((skill) => (
            <Badge key={skill.label} variant="secondary">
              {skill.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
