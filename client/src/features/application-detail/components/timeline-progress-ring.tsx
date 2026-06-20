import { cn } from "@/lib/utils"

interface TimelineProgressRingProps {
  readonly percent: number
  readonly className?: string
}

const RADIUS = 27
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function TimelineProgressRing({ percent, className }: TimelineProgressRingProps) {
  const offset = CIRCUMFERENCE * (1 - percent / 100)

  return (
    <div className={cn("relative flex size-16 shrink-0 items-center justify-center", className)}>
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={RADIUS} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="stroke-primary transition-all"
          stroke="currentColor"
        />
      </svg>
      <span className="absolute text-sm font-bold text-primary">
        {percent}
        <span className="text-[10px] font-medium">%</span>
      </span>
    </div>
  )
}
