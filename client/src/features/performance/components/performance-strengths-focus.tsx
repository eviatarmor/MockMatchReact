import { useTranslation } from "react-i18next"
import { TrendingUp, ArrowRight } from "lucide-react"
import type { StrengthItem, FocusAreaItem } from "../types"

interface PerformanceStrengthsFocusProps {
  readonly strengths: readonly StrengthItem[]
  readonly focusAreas: readonly FocusAreaItem[]
}

export function PerformanceStrengthsFocus({ strengths, focusAreas }: PerformanceStrengthsFocusProps) {
  const { t } = useTranslation("common")

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">{t("performance.strengths.title")}</h2>
        <div className="flex flex-col gap-3">
          {strengths.map((s) => (
            <div key={s.id} className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{s.title}</span>
                <span className="text-xs text-muted-foreground">{s.subtitle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">{t("performance.focusAreas.title")}</h2>
        <div className="flex flex-col gap-2">
          {focusAreas.map((f) => (
            <button key={f.id} className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3 text-left hover:bg-muted/40 transition-colors cursor-pointer">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-950/30">
                <span className="text-amber-600 dark:text-amber-400 text-sm">◎</span>
              </div>
              <div className="flex flex-1 flex-col min-w-0">
                <span className="text-sm font-medium">{f.title}</span>
                <span className="text-xs text-muted-foreground">{f.subtitle}</span>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
