import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ProgressRingProps {
  readonly value: number // 0-100
  readonly box?: number // svg viewBox size (coordinate space)
  readonly radius?: number
  readonly strokeWidth?: number
  readonly trackClass?: string
  readonly progressClass?: string
  readonly className?: string // container: controls rendered size + layout
  readonly children?: ReactNode // centered content (score, percent, ...)
}

// Circular progress indicator. Owns the SVG circle math so call sites only pick
// size, colors, and the centered content.
export function ProgressRing({
  value,
  box = 64,
  radius = 27,
  strokeWidth = 4,
  trackClass = "stroke-muted",
  progressClass = "stroke-primary",
  className,
  children,
}: ProgressRingProps) {
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - value / 100)
  const center = box / 2

  return (
    <div className={cn("relative flex shrink-0 items-center justify-center", className)}>
      <svg viewBox={`0 0 ${box} ${box}`} className="size-full -rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={strokeWidth} stroke="currentColor" className={trackClass} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke="currentColor"
          className={cn("transition-all", progressClass)}
        />
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>}
    </div>
  )
}
