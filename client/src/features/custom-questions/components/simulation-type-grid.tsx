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

function TypeSkeletonGrid() {
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

function typeCardClassName(isSelected: boolean, createSupported: boolean) {
  return cn(
    "flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition-colors",
    "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isSelected
      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
      : "border-border/60 bg-card hover:border-border hover:bg-muted/20",
    !createSupported && "cursor-not-allowed opacity-50"
  )
}

function typeIconWrapClassName(isSelected: boolean) {
  return cn(
    "flex size-9 items-center justify-center rounded-lg",
    isSelected
      ? "bg-primary/15 text-primary"
      : "bg-muted text-muted-foreground"
  )
}

function SimulationTypeCardButton({
  type,
  selected,
  onSelect,
}: {
  readonly type: SimulationTypeCard
  readonly selected: QuestionFormat | null
  readonly onSelect: (format: QuestionFormat) => void
}) {
  const { t } = useTranslation("common")
  const Icon = formatIcon(type.format)
  const isSelected = selected === type.format
  const label = t(`simulations.format.${formatLabelKey(type.format)}`)
  const hint = t(
    `customQuestions.formats.${formatLabelKey(type.format)}.hint`,
    { defaultValue: type.notes ?? "" }
  )

  return (
    <button
      type="button"
      disabled={!type.createSupported}
      onClick={() => onSelect(type.format)}
      className={typeCardClassName(isSelected, type.createSupported)}
      aria-pressed={isSelected}
    >
      <span className={typeIconWrapClassName(isSelected)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="line-clamp-2 text-xs text-muted-foreground">{hint}</span>
    </button>
  )
}

export function SimulationTypeGrid({
  types,
  selected,
  onSelect,
  isLoading,
}: SimulationTypeGridProps) {
  if (isLoading) return <TypeSkeletonGrid />

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {types.map((type, index) => (
        <StaggerItem key={type.id} index={index}>
          <SimulationTypeCardButton
            type={type}
            selected={selected}
            onSelect={onSelect}
          />
        </StaggerItem>
      ))}
    </div>
  )
}
