import { Sparkles, ExternalLink, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MatchScoreRing } from "./match-score-ring"
import type { DiscoverJob } from "../types"

interface DiscoverJobCardProps {
  readonly job: DiscoverJob
}

export function DiscoverJobCard({ job }: DiscoverJobCardProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-primary">
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
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{job.location}</span>
              <span>{job.salaryRange}</span>
              <span className="capitalize">{job.seniority}</span>
              <span>{job.postedAt}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <MatchScoreRing score={job.matchScore} tier={job.matchTier} />
          <Button size="sm" className="h-8 gap-1.5 cursor-pointer">
            <ExternalLink className="size-4" />
            {t("jobTracker.actions.track")}
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>{job.fitNote}</span>
      </div>

      <div className="flex items-center justify-between gap-4">
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

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer">
            <ExternalLink className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer">
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
