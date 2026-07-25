import { cn } from "@/lib/utils"
import { ProgressRing } from "@/components/data/progress-ring"
import { MATCH_TIER_TEXT_CLASS } from "../constants"
import type { MatchTier } from "../types"

interface MatchScoreRingProps {
  readonly score: number
  readonly tier: MatchTier
  readonly className?: string
}

// Ring + score, colored by match tier. Callers add a tier label alongside when
// they want one (see MATCH_TIER_TEXT_CLASS).
export function MatchScoreRing({ score, tier, className }: MatchScoreRingProps) {
  const colorClass = MATCH_TIER_TEXT_CLASS[tier]

  return (
    <ProgressRing value={score} className={cn("size-14", className)} trackClass="stroke-muted" progressClass={colorClass}>
      <span className={cn("text-sm font-bold", colorClass)}>{score}</span>
    </ProgressRing>
  )
}
