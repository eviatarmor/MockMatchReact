import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { MatchTier } from "../types"

interface MatchScoreRingProps {
  readonly score: number
  readonly tier: MatchTier
  readonly className?: string
}

const TIER_COLOR_CLASS: Record<MatchTier, string> = {
  strong: "text-emerald-600",
  good: "text-blue-600",
  fair: "text-amber-600",
}

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function MatchScoreRing({ score, tier, className }: MatchScoreRingProps) {
  const { t } = useTranslation("common")
  const offset = CIRCUMFERENCE * (1 - score / 100)
  const colorClass = TIER_COLOR_CLASS[tier]

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative flex size-16 items-center justify-center">
        <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="none"
            strokeWidth="5"
            className="stroke-muted"
          />
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className={cn("transition-all", colorClass)}
            stroke="currentColor"
          />
        </svg>
        <span className={cn("absolute text-base font-bold", colorClass)}>{score}</span>
      </div>
      <span className={cn("text-[11px] font-medium whitespace-nowrap", colorClass)}>
        {t(`jobTracker.matchTiers.${tier}`)}
      </span>
    </div>
  )
}
