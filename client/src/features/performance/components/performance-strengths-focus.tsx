import { useTranslation } from "react-i18next"
import { TrendingUp, ArrowRight, Target } from "lucide-react"
import type { StrengthItem, FocusAreaItem } from "../types"

interface PerformanceStrengthsFocusProps {
  readonly strengths: readonly StrengthItem[]
  readonly focusAreas: readonly FocusAreaItem[]
}

export function PerformanceStrengthsFocus({ strengths, focusAreas }: PerformanceStrengthsFocusProps) {
  const { t } = useTranslation("common")

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="font-heading text-base font-semibold text-foreground">{t("performance.strengths.title")}</h2>
        <div className="flex flex-col gap-3">
          {strengths.map((s) => (
            <div key={s.id} className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
                <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{t(s.titleKey)}</span>
                <span className="text-xs text-muted-foreground">{t(s.subtitleKey)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="font-heading text-base font-semibold text-foreground">{t("performance.focusAreas.title")}</h2>
        <div className="flex flex-col gap-2">
          {focusAreas.map((f) => (
            <button
              key={f.id}
              type="button"
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-left transition-colors hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/15">
                <Target className="size-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">{t(f.titleKey)}</span>
                <span className="text-xs text-muted-foreground">{t(f.subtitleKey)}</span>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
