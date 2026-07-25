import { cn } from "@/lib/utils"
import { ProgressRing } from "@/components/data/progress-ring"
import { SCORE_BAND_TEXT_CLASS, scoreBand } from "@/lib/score-tier"

interface MatchScoreRingProps {
  readonly score: number
  readonly className?: string
}

/**
 * Ring + score, colored by the shared general-score bands
 * (strong ≥85 emerald · ok ≥70 amber · weak &lt;70 rose).
 */
export function MatchScoreRing({ score, className }: MatchScoreRingProps) {
  const colorClass = SCORE_BAND_TEXT_CLASS[scoreBand(score)]

  return (
    <ProgressRing
      value={score}
      className={cn("size-14", className)}
      trackClass="stroke-muted"
      progressClass={colorClass}
    >
      <span className={cn("text-sm font-bold", colorClass)}>{score}</span>
    </ProgressRing>
  )
}
