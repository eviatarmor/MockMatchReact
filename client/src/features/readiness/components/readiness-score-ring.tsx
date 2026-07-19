import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { ProgressRing } from "@/components/data/progress-ring"

interface ReadinessScoreRingProps {
  readonly score: number
  readonly delta: number
}

export function ReadinessScoreRing({ score, delta }: ReadinessScoreRingProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <ProgressRing
        value={score}
        box={100}
        radius={40}
        strokeWidth={10}
        className="size-24"
        trackClass="text-muted/20"
        progressClass="text-primary duration-700"
      >
        <span className="text-2xl font-bold leading-none">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </ProgressRing>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-muted-foreground">{t("readiness.overallLabel")}</p>
        <Badge variant="secondary">
          {t("readiness.almostReady")}
        </Badge>
        <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
          <span>↗</span>
          <span>+{delta} {t("readiness.thisMonth")}</span>
        </p>
        <p className="text-xs text-muted-foreground max-w-[18ch]">
          {t("readiness.improveTip")}
        </p>
      </div>
    </div>
  )
}
