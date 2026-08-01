import { useTranslation } from "react-i18next"
import { NumberTicker } from "@mockmatch/ui/shadcn-space/number-ticker/number-ticker-01"

interface ReadinessProgressBarProps {
  readonly score: number
  readonly maxScore: number
}

export function ReadinessProgressBar({ score, maxScore }: ReadinessProgressBarProps) {
  const { t } = useTranslation("login")
  const progressPercent = (score / maxScore) * 100

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-primary-foreground/80">
          {t("readinessCard.label")}
        </span>
        <span className="text-2xl font-bold tabular-nums">
          <NumberTicker end={score} duration={0.6} />
          <span className="text-base font-normal text-primary-foreground/60">
            {" "}
            / {maxScore}
          </span>
        </span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-[width] duration-200 ease-out motion-reduce:transition-none"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </>
  )
}
