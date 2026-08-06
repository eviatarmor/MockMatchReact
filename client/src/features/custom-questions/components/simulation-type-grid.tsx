import { useTranslation } from "react-i18next"
import { StaggerItem } from "@mockmatch/ui/stagger"
import { cn } from "@/lib/utils"
import { formatIcon, formatLabelKey } from "../constants"
import type { QuestionFormat, SimulationTypeCard } from "../types"

interface SimulationTypeGridProps {
  readonly types: readonly SimulationTypeCard[]
  readonly selected: QuestionFormat | null
  readonly onSelect: (format: QuestionFormat) => void
  readonly isLoading?: boolean
}

export function SimulationTypeGrid({
  types,
  selected,
  onSelect,
  isLoading,
}: SimulationTypeGridProps) {
  const { t } = useTranslation("common")

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-border/40 bg-muted/30"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {types.map((type, index) => {
        const Icon = formatIcon(type.format)
        const isSelected = selected === type.format
        const label = t(`simulations.format.${formatLabelKey(type.format)}`)
        return (
          <StaggerItem key={type.id} index={index}>
            <button
              type="button"
              disabled={!type.createSupported}
              onClick={() => onSelect(type.format)}
              className={cn(
                "flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition-colors",
                "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60 bg-card hover:border-border hover:bg-muted/20",
                !type.createSupported && "cursor-not-allowed opacity-50"
              )}
              aria-pressed={isSelected}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  isSelected
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {t(`customQuestions.formats.${formatLabelKey(type.format)}.hint`, {
                  defaultValue: type.notes ?? "",
                })}
              </span>
            </button>
          </StaggerItem>
        )
      })}
    </div>
  )
}
