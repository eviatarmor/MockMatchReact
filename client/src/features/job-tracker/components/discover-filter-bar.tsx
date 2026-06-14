import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SENIORITY_FILTERS } from "../constants"
import type { SeniorityLevel } from "../types"

type SeniorityFilter = "all" | SeniorityLevel
type SortOption = "bestMatch" | "newest" | "salary"

interface DiscoverFilterBarProps {
  readonly remoteOnly: boolean
  readonly onRemoteOnlyChange: (value: boolean) => void
  readonly seniorityFilter: SeniorityFilter
  readonly onSeniorityFilterChange: (value: SeniorityFilter) => void
  readonly sort: SortOption
  readonly onSortChange: (value: SortOption) => void
}

const SORT_OPTIONS: SortOption[] = ["bestMatch", "newest", "salary"]

export function DiscoverFilterBar({
  remoteOnly,
  onRemoteOnlyChange,
  seniorityFilter,
  onSeniorityFilterChange,
  sort,
  onSortChange,
}: DiscoverFilterBarProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={remoteOnly ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1.5 rounded-full cursor-pointer"
          onClick={() => onRemoteOnlyChange(!remoteOnly)}
        >
          <Globe className="size-3.5" />
          {t("jobTracker.filters.remote")}
        </Button>

        <div className="flex items-center rounded-full border bg-muted/30 p-0.5">
          {(["all", ...SENIORITY_FILTERS] as SeniorityFilter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSeniorityFilterChange(option)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors cursor-pointer",
                seniorityFilter === option
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`jobTracker.filters.${option}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("jobTracker.sort.label")}</span>
        <div className="flex items-center rounded-full border bg-muted/30 p-0.5">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSortChange(option)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors cursor-pointer",
                sort === option
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`jobTracker.sort.${option}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
