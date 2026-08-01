import { MapPin, DollarSign, Clock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Badge } from "@mockmatch/ui/badge"
import { SelectCard } from "@mockmatch/ui/card"
import { Skeleton } from "@mockmatch/ui/skeleton"
import { DocumentScoreBadge } from "@/components/data/document-score-badge"
import type { DiscoverJob } from "../types"

interface DiscoverJobListItemProps {
  readonly job: DiscoverJob
  readonly selected: boolean
  readonly onSelect: (job: DiscoverJob) => void
}

function isEmptyMeta(value: string | null | undefined): boolean {
  if (value == null) return true
  const trimmed = value.trim()
  return trimmed === "" || trimmed === "—" || trimmed === "-"
}

export function DiscoverJobListItem({
  job,
  selected,
  onSelect,
}: DiscoverJobListItemProps) {
  const { t } = useTranslation("common")

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
    !isEmptyMeta(job.postedAt) && {
      key: "posted",
      icon: Clock,
      label: job.postedAt,
    },
  ].filter(Boolean) as Array<{
    key: string
    icon: typeof MapPin
    label: string
  }>

  return (
    <SelectCard
      role="option"
      aria-selected={selected}
      tabIndex={0}
      selected={selected}
      onClick={() => onSelect(job)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(job)
        }
      }}
      className="flex items-start gap-3 p-3.5"
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold select-none",
          job.avatarColorClass
        )}
        aria-hidden
      >
        {job.avatarText}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold leading-snug text-foreground">
            {job.title}
          </span>
          {job.isNew && (
            <Badge variant="default" className="h-4 px-1.5 text-2xs">
              {t("discover.filters.new")}
            </Badge>
          )}
          {job.remoteType === "remote" && (
            <Badge variant="secondary" className="h-4 px-1.5 text-2xs">
              {t("discover.filters.remote")}
            </Badge>
          )}
          {job.remoteType === "hybrid" && (
            <Badge variant="outline" className="h-4 px-1.5 text-2xs">
              {t("discover.remoteTypes.hybrid")}
            </Badge>
          )}
        </div>

        <span className="truncate text-sm text-muted-foreground">
          {job.company}
        </span>

        {meta.length > 0 && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {meta.map((item) => (
              <span key={item.key} className="flex min-w-0 items-center gap-1">
                <item.icon className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-start">
        {job.scorePending && job.matchScore == null ? (
          <Skeleton className="h-5 w-8 rounded-full" />
        ) : (
          <DocumentScoreBadge
            score={job.matchScore ?? null}
            className="min-w-9"
          />
        )}
      </div>
    </SelectCard>
  )
}
