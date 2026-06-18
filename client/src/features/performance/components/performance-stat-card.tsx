import { Target, Mic2, Timer, Trophy } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { PerformanceStat } from "../types"

const ICON_MAP: Record<string, LucideIcon> = { Target, Mic2, Timer, Trophy }

interface PerformanceStatCardProps {
  readonly stat: PerformanceStat
}

export function PerformanceStatCard({ stat }: PerformanceStatCardProps) {
  const { t } = useTranslation("common")
  const Icon = ICON_MAP[stat.iconName] ?? Target

  return (
    <div className="flex items-start justify-between rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{t(stat.labelKey)}</p>
        <p className="text-2xl font-bold leading-tight">
          {stat.value}{" "}
          {stat.subValue && <span className="text-sm font-normal text-muted-foreground">{stat.subValue}</span>}
        </p>
        <p className={`flex items-center gap-1 text-xs ${stat.deltaPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
          <span>{stat.deltaPositive ? "↗" : "↘"}</span>
          {stat.delta}
        </p>
      </div>
      <Icon className="size-5 text-muted-foreground/50" />
    </div>
  )
}
