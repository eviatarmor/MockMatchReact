import { useTranslation } from "react-i18next"
import type { ReadinessArea } from "../types"

interface ReadinessByAreaProps {
  readonly areas: readonly ReadinessArea[]
}

export function ReadinessByArea({ areas }: ReadinessByAreaProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-heading text-base font-semibold text-foreground">{t("readiness.byArea.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("readiness.byArea.description")}</p>
      </div>

      <div className="flex flex-col gap-4">
        {areas.map((area) => (
          <div key={area.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{t(area.labelKey)}</span>
              <span className="text-sm tabular-nums text-muted-foreground">{area.score}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${area.color}`}
                style={{ width: `${area.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
