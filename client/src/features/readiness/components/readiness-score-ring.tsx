import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { OVERALL_SCORE } from "../constants"

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface ReadinessScoreRingProps {
  readonly score: number
  readonly delta: number
}

export function ReadinessScoreRing({ score, delta }: ReadinessScoreRingProps) {
  const { t } = useTranslation("common")
  const progress = (score / 100) * CIRCUMFERENCE
  const gap = CIRCUMFERENCE - progress

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="relative shrink-0 size-24">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={`${progress} ${gap}`}
            strokeLinecap="round"
            className="text-primary transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none">{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-muted-foreground">{t("readiness.overallLabel")}</p>
        <Badge variant="outline" className="w-fit border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
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

export { OVERALL_SCORE }
