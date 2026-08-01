import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { SCORE_BAND_BADGE_CLASS, scoreBand } from "@/lib/score-tier"
import { Badge } from "@mockmatch/ui/badge"

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
  const { t } = useTranslation("common")

  if (score === null) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "min-w-8 justify-center text-2xs tabular-nums text-muted-foreground",
          className
        )}
        title={t("documentScore.notScored")}
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
        "min-w-8 justify-center border text-2xs tabular-nums font-semibold",
        SCORE_BAND_BADGE_CLASS[band],
        className
      )}
      title={t("documentScore.bandTitle", {
        band: t(`documentScore.bands.${band}`),
        score,
      })}
    >
      {score}
    </Badge>
  )
}
