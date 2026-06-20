import { ProgressRing } from "@/components/data/progress-ring"

interface TimelineProgressRingProps {
  readonly percent: number
  readonly className?: string
}

export function TimelineProgressRing({ percent, className }: TimelineProgressRingProps) {
  return (
    <ProgressRing value={percent} className={`size-16 ${className ?? ""}`} progressClass="stroke-primary">
      <span className="text-sm font-bold text-primary">
        {percent}
        <span className="text-[10px] font-medium">%</span>
      </span>
    </ProgressRing>
  )
}
