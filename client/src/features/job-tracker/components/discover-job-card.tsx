import { Sparkles, MapPin, DollarSign, Briefcase, Clock, Bookmark, MoreHorizontal, Send, Wand2, ArrowUpRight, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{job.title}</span>
              {job.isNew && (
                <Badge className="h-5 rounded-full bg-blue-600 text-white">New</Badge>
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
              <span className="flex items-center gap-1 capitalize">
                <Briefcase className="size-3.5" />
                {job.seniority} · {t(`jobTracker.employmentTypes.${job.employmentType}`)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {job.postedAt}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <MatchScoreRing score={job.matchScore} tier={job.matchTier} />
          <span className={cn("text-[11px] font-medium whitespace-nowrap", MATCH_TIER_TEXT_CLASS[job.matchTier])}>
            {t(`jobTracker.matchTiers.${job.matchTier}`)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{job.fitNote}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button size="sm" className="h-8 gap-1.5 cursor-pointer">
            <Bookmark className="size-4" />
            {t("jobTracker.actions.track")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="icon" className="size-8 cursor-pointer" />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem className="cursor-pointer">
                <Send className="size-4" />
                {t("jobTracker.actions.applyToRole")}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Wand2 className="size-4" />
                {t("jobTracker.actions.tailorResume")}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => onViewDetails(job)}>
                <ArrowUpRight className="size-4" />
                {t("jobTracker.actions.viewDetails")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="cursor-pointer">
                <X className="size-4" />
                {t("jobTracker.actions.notInterested")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {job.skills.map((skill) => (
          <Badge
            key={skill.label}
            variant={skill.matched ? "secondary" : "outline"}
            className={cn(
              "rounded-full",
              skill.matched
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "text-muted-foreground"
            )}
          >
            {skill.matched ? "✓ " : "− "}
            {skill.label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
