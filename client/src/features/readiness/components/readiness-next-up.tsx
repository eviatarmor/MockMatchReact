import { Code2, Mic2, FileText, ArrowRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { NextUpItem } from "../types"

const ICON_MAP: Record<string, LucideIcon> = { Code2, Mic2, FileText }

interface ReadinessNextUpProps {
  readonly items: readonly NextUpItem[]
}

export function ReadinessNextUp({ items }: ReadinessNextUpProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold">{t("readiness.nextUp.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("readiness.nextUp.description")}</p>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const Icon = ICON_MAP[item.iconName] ?? Code2
          return (
            <button
              key={item.id}
              className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background border">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="flex flex-1 flex-col min-w-0">
                <span className="text-sm font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">{t(item.subtitle)}</span>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
