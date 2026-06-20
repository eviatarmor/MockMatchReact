import { CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { resolveIcon } from "@/lib/icon-map"
import type { AssessmentStat } from "../types"

interface AssessmentStatCardProps {
  readonly stat: AssessmentStat
}

export function AssessmentStatCard({ stat }: AssessmentStatCardProps) {
  const { t } = useTranslation("common")
  const Icon = resolveIcon(stat.iconName, CheckCircle2)

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <Icon className="size-5 shrink-0 text-primary" />
      <div className="flex flex-col">
        <span className="text-xl font-bold leading-tight">{stat.value}</span>
        <span className="text-xs text-muted-foreground">{t(stat.labelKey)}</span>
      </div>
    </div>
  )
}
