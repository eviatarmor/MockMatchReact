import { Globe, DollarSign, Briefcase, ChevronDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchBar } from "@/components/dashboard/search-bar"
import { cn } from "@/lib/utils"
import { EMPLOYMENT_TYPE_OPTIONS, SALARY_FILTER_OPTIONS } from "../constants"
import type { DiscoverFilterKey, EmploymentType } from "../types"

type SortOption = "bestMatch" | "newest" | "salary"

interface DiscoverFilterBarProps {
  readonly search: string
  readonly onSearchChange: (value: string) => void
  readonly activeFilters: ReadonlySet<DiscoverFilterKey>
  readonly onToggleFilter: (key: DiscoverFilterKey) => void
  readonly minSalary: number
  readonly onMinSalaryChange: (value: number) => void
  readonly employmentTypes: ReadonlySet<EmploymentType>
  readonly onToggleEmploymentType: (value: EmploymentType) => void
  readonly sort: SortOption
  readonly onSortChange: (value: SortOption) => void
}

const FILTER_PILLS: ReadonlyArray<{ key: DiscoverFilterKey; icon: LucideIcon }> = [
  { key: "remote", icon: Globe },
]

const SORT_OPTIONS: SortOption[] = ["bestMatch", "newest", "salary"]

function salaryLabel(value: number): string {
  return value === 0 ? "Any" : `$${value / 1000}K+`
}

export function DiscoverFilterBar({
  search,
  onSearchChange,
  activeFilters,
  onToggleFilter,
  minSalary,
  onMinSalaryChange,
  employmentTypes,
  onToggleEmploymentType,
  sort,
  onSortChange,
}: DiscoverFilterBarProps) {
  const { t } = useTranslation("common")
  const employmentLabel =
    employmentTypes.size === 0
      ? t("jobTracker.filters.employment")
      : EMPLOYMENT_TYPE_OPTIONS.filter((type) => employmentTypes.has(type))
          .map((type) => t(`jobTracker.employmentTypes.${type}`))
          .join(", ")

  return (
    <div className="flex items-center justify-between gap-2 overflow-x-auto">
      <div className="flex shrink-0 items-center gap-2">
        <SearchBar
          placeholder={t("dashboard.search.discover")}
          value={search}
          onChange={onSearchChange}
        />
        {FILTER_PILLS.map(({ key, icon: Icon }) => (
          <Button
            key={key}
            variant={activeFilters.has(key) ? "default" : "outline"}
            size="sm"
            className="gap-1.5 cursor-pointer"
            onClick={() => onToggleFilter(key)}
          >
            <Icon className="size-3.5" />
            {t(`jobTracker.filters.${key}`)}
          </Button>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant={minSalary > 0 ? "default" : "outline"}
                size="sm"
                className="gap-1.5 cursor-pointer"
              />
            }
          >
            <DollarSign className="size-3.5" />
            {minSalary > 0 ? salaryLabel(minSalary) : t("jobTracker.filters.salary")}
            <ChevronDown className="size-3.5 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-32">
            <DropdownMenuRadioGroup
              value={String(minSalary)}
              onValueChange={(value) => onMinSalaryChange(Number(value))}
            >
              {SALARY_FILTER_OPTIONS.map((value) => (
                <DropdownMenuRadioItem
                  key={value}
                  value={String(value)}
                  className="cursor-pointer"
                >
                  {salaryLabel(value)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant={employmentTypes.size > 0 ? "default" : "outline"}
                size="sm"
                className="max-w-56 gap-1.5 cursor-pointer"
              />
            }
          >
            <Briefcase className="size-3.5" />
            <span className="truncate">{employmentLabel}</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-40">
            {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={employmentTypes.has(type)}
                onCheckedChange={() => onToggleEmploymentType(type)}
                onSelect={(event) => event.preventDefault()}
                className="cursor-pointer"
              >
                {t(`jobTracker.employmentTypes.${type}`)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("jobTracker.sort.label")}</span>
        <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSortChange(option)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors cursor-pointer",
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
