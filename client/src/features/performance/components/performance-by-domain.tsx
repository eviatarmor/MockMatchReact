import { useTranslation } from "react-i18next"
import type { DomainScore } from "../types"

interface PerformanceByDomainProps {
  readonly domains: readonly DomainScore[]
}

export function PerformanceByDomain({ domains }: PerformanceByDomainProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold">{t("performance.byDomain.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("performance.byDomain.description")}</p>
      </div>

      <div className="flex flex-col gap-4">
        {domains.map((d) => (
          <div key={d.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t(d.labelKey)}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{d.score}</span>
                <span className={`text-xs font-medium ${d.delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                  {d.delta >= 0 ? "↗" : "↘"} {d.delta >= 0 ? `+${d.delta}` : d.delta}
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
              <div
                className={`h-full rounded-full transition-all duration-700 ${d.color}`}
                style={{ width: `${d.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
