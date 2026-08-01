import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrackingProgressDotsProps {
  readonly totalSteps: number
  readonly completedSteps: number
  readonly activeStepIndex: number | null
}

export function TrackingProgressDots({
  totalSteps,
  completedSteps,
  activeStepIndex,
}: TrackingProgressDotsProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSteps }, (_, index) => {
        const isCompleted = index < completedSteps
        const isActive = index === activeStepIndex

        return (
          <span
            key={index}
            className={cn(
              "flex size-4 items-center justify-center rounded-full border text-2xs",
              isCompleted && "border-emerald-500 bg-emerald-500 text-primary-foreground",
              isActive && !isCompleted && "border-amber-500 bg-amber-500 text-primary-foreground",
              !isCompleted && !isActive && "border-border bg-muted text-muted-foreground"
            )}
            aria-hidden
          >
            {isCompleted && <Check className="size-2.5" />}
          </span>
        )
      })}
    </div>
  )
}
