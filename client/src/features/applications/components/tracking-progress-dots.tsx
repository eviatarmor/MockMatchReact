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
              "flex size-4 items-center justify-center rounded-full border text-[10px]",
              isCompleted && "border-emerald-500 bg-emerald-500 text-white",
              isActive && !isCompleted && "border-amber-500 bg-amber-500 text-white",
              !isCompleted && !isActive && "border-muted bg-muted"
            )}
          >
            {isCompleted && <Check className="size-2.5" />}
          </span>
        )
      })}
    </div>
  )
}
