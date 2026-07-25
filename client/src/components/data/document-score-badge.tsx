import { cn } from "@/lib/utils"
import { SCORE_BAND_BADGE_CLASS, scoreBand } from "@/lib/score-tier"
import { Badge } from "@/components/ui/badge"

interface DocumentScoreBadgeProps {
  /** 0–100 general score, or null when not yet computed. */
  readonly score: number | null
  readonly className?: string
}

/**
 * Compact score chip: bare number, or em dash when unknown.
 * Colors match editor general analysis (strong / ok / weak).
 */
export function DocumentScoreBadge({ score, className }: DocumentScoreBadgeProps) {
  if (score === null) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "min-w-8 justify-center tabular-nums text-muted-foreground",
          className
        )}
        title="Not scored yet"
      >
        —
      </Badge>
    )
  }

  const band = scoreBand(score)
  return (
    <Badge
      variant="outline"
      className={cn(
        "min-w-8 justify-center border tabular-nums font-semibold",
        SCORE_BAND_BADGE_CLASS[band],
        className
      )}
      title={`${band} · ${score}`}
    >
      {score}
    </Badge>
  )
}
