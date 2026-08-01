import { Code2, ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { resolveIcon } from "@/lib/icon-map"
import type { NextUpItem } from "../types"

interface ReadinessNextUpProps {
  readonly items: readonly NextUpItem[]
}

export function ReadinessNextUp({ items }: ReadinessNextUpProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-heading text-base font-semibold text-foreground">{t("readiness.nextUp.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("readiness.nextUp.description")}</p>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const Icon = resolveIcon(item.iconName, Code2)
          return (
            <button
              key={item.id}
              type="button"
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-left transition-colors hover:bg-muted/40 cursor-pointer"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">{t(item.titleKey)}</span>
                <span className="text-xs text-muted-foreground">{t(item.subtitleKey)}</span>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
