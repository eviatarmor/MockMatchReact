import {
  Globe,
  DollarSign,
  Briefcase,
  ChevronDown,
  MapPin,
  Clock,
  Crosshair,
  Loader2,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  EMPLOYMENT_TYPE_OPTIONS,
  POSTED_WITHIN_OPTIONS,
  SALARY_FILTER_OPTIONS,
} from "../constants"
import type {
  DiscoverSortOption,
  EmploymentType,
  PostedWithinDays,
} from "../types"
import type { LocationDetectStatus } from "../hooks/use-detect-location"

interface DiscoverFilterBarProps {
  readonly search: string
  readonly onSearchChange: (value: string) => void
  readonly location: string
  readonly onLocationChange: (value: string) => void
  readonly locationStatus: LocationDetectStatus
  readonly onDetectLocation: () => void
  readonly allowLocation: boolean
  readonly remoteOnly: boolean
  readonly onToggleRemote: () => void
  readonly minSalary: number
  readonly onMinSalaryChange: (value: number) => void
  readonly employmentTypes: ReadonlySet<EmploymentType>
  readonly onToggleEmploymentType: (value: EmploymentType) => void
  readonly postedWithin: PostedWithinDays
  readonly onPostedWithinChange: (value: PostedWithinDays) => void
  readonly sort: DiscoverSortOption
  readonly onSortChange: (value: DiscoverSortOption) => void
}

const SORT_OPTIONS: DiscoverSortOption[] = ["bestMatch", "newest", "salary"]

function salaryLabel(value: number): string {
  return value === 0 ? "Any" : `$${value / 1000}K+`
}

function postedLabel(
  value: PostedWithinDays,
  t: (key: string) => string
): string {
  if (value === 0) return t("discover.filters.postedAny")
  return t(`discover.filters.posted${value}d`)
}

export function DiscoverFilterBar({
  search,
  onSearchChange,
  location,
  onLocationChange,
  locationStatus,
  onDetectLocation,
  allowLocation,
  remoteOnly,
  onToggleRemote,
  minSalary,
  onMinSalaryChange,
  employmentTypes,
  onToggleEmploymentType,
  postedWithin,
  onPostedWithinChange,
  sort,
  onSortChange,
}: DiscoverFilterBarProps) {
  const { t } = useTranslation("common")
  const employmentLabel =
    employmentTypes.size === 0
      ? t("discover.filters.employment")
      : EMPLOYMENT_TYPE_OPTIONS.filter((type) => employmentTypes.has(type))
          .map((type) => t(`discover.employmentTypes.${type}`))
          .join(", ")

  const detecting = locationStatus === "detecting"

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex shrink-0 items-center gap-2">
          <SearchBar
            placeholder={t("dashboard.search.discover")}
            value={search}
            onChange={onSearchChange}
            className="max-w-[200px] sm:max-w-[240px] md:max-w-[280px]"
          />

          <div className="relative flex items-center">
            <MapPin className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder={t("discover.filters.locationPlaceholder")}
              className="h-8 w-[140px] bg-muted/30 pl-8 pr-9 text-sm sm:w-[160px] md:w-[180px]"
              aria-label={t("discover.filters.location")}
            />
            {allowLocation && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0.5 size-7 cursor-pointer"
                onClick={onDetectLocation}
                disabled={detecting}
                title={t("discover.filters.useMyLocation")}
                aria-label={t("discover.filters.useMyLocation")}
              >
                {detecting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Crosshair className="size-3.5" />
                )}
              </Button>
            )}
          </div>

          <Button
            variant={remoteOnly ? "default" : "outline"}
            size="sm"
            className="gap-1.5 cursor-pointer"
            onClick={onToggleRemote}
          >
            <Globe className="size-3.5" />
            {t("discover.filters.remote")}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant={postedWithin > 0 ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 cursor-pointer"
                />
              }
            >
              <Clock className="size-3.5" />
              {postedWithin > 0
                ? postedLabel(postedWithin, t)
                : t("discover.filters.posted")}
              <ChevronDown className="size-3.5 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-36">
              <DropdownMenuRadioGroup
                value={String(postedWithin)}
                onValueChange={(value) =>
                  onPostedWithinChange(Number(value) as PostedWithinDays)
                }
              >
                {POSTED_WITHIN_OPTIONS.map((value) => (
                  <DropdownMenuRadioItem
                    key={value}
                    value={String(value)}
                    className="cursor-pointer"
                  >
                    {postedLabel(value, t)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

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
              {minSalary > 0 ? salaryLabel(minSalary) : t("discover.filters.salary")}
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
                  {t(`discover.employmentTypes.${type}`)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("discover.sort.label")}
          </span>
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
                {t(`discover.sort.${option}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
