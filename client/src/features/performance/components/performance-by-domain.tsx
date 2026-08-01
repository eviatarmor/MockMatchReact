import { useTranslation } from "react-i18next"
import type { DomainScore } from "../types"

interface PerformanceByDomainProps {
  readonly domains: readonly DomainScore[]
}

export function PerformanceByDomain({ domains }: PerformanceByDomainProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-heading text-base font-semibold text-foreground">{t("performance.byDomain.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("performance.byDomain.description")}</p>
      </div>

      <div className="flex flex-col gap-4">
        {domains.map((d) => (
          <div key={d.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{t(d.labelKey)}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums text-muted-foreground">{d.score}</span>
                <span
                  className={
                    d.delta >= 0
                      ? "text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
                      : "text-xs font-medium tabular-nums text-rose-600 dark:text-rose-400"
                  }
                >
                  {d.delta >= 0 ? "↗" : "↘"} {d.delta >= 0 ? `+${d.delta}` : d.delta}
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${d.color}`}
                style={{ width: `${d.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
