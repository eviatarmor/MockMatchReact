import { Send, Timer, AlignJustify, CheckCircle2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { AutofillStat } from "../types"

const ICON_MAP: Record<string, LucideIcon> = { Send, Timer, AlignJustify, CheckCircle2 }

interface AutofillStatCardProps {
  readonly stat: AutofillStat
}

export function AutofillStatCard({ stat }: AutofillStatCardProps) {
  const { t } = useTranslation("common")
  const Icon = ICON_MAP[stat.iconName] ?? Send

  return (
    <div className="flex items-start justify-between rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{t(stat.labelKey)}</p>
        <p className="text-2xl font-bold leading-tight">
          {stat.value}{" "}
          {stat.subValue && <span className="text-sm font-normal text-muted-foreground">{stat.subValue}</span>}
        </p>
      </div>
      <Icon className="size-5 text-muted-foreground/50" />
    </div>
  )
}
