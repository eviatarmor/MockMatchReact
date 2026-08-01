import { cn } from "@/lib/utils"
import type { PrepStep } from "../types"

interface PrepStepRailProps {
  readonly steps: PrepStep[]
  readonly activeStepId: string | null
  readonly onSelectStep: (id: string) => void
}

export function PrepStepRail({ steps, activeStepId, onSelectStep }: PrepStepRailProps) {
  const activeIndex = steps.findIndex((step) => step.id === activeStepId)

  return (
    <div className="sticky top-0 hidden shrink-0 flex-col items-center gap-0 pt-1 sm:flex">
      {steps.map((step, index) => {
        const isActive = index === activeIndex
        const isCompleted = index < activeIndex
        const Icon = step.icon

        return (
          <div key={step.id} className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => onSelectStep(step.id)}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer",
                isActive && "border-primary bg-primary text-primary-foreground",
                isCompleted && !isActive && "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                !isActive && !isCompleted && "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "step" : undefined}
            >
              <Icon className="size-4" />
            </button>
            {index < steps.length - 1 && <div className="h-16 w-px bg-border/60" aria-hidden />}
          </div>
        )
      })}
    </div>
  )
}
