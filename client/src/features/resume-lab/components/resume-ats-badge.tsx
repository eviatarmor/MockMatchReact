import { Gauge } from "lucide-react"

interface ResumeATSBadgeProps {
  readonly score: number | null
}

export function ResumeATSBadge({ score }: ResumeATSBadgeProps) {
  if (score === null) {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border/50">
        <Gauge className="size-3.5" />
        <span>ATS -</span>
      </div>
    )
  }

  let colorClasses = ""
  if (score >= 85) {
    colorClasses =
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30"
  } else if (score >= 80) {
    colorClasses =
      "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200/50 dark:border-orange-800/30"
  } else if (score >= 70) {
    colorClasses =
      "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30"
  } else {
    colorClasses =
      "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/30"
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${colorClasses}`}
    >
      <Gauge className="size-3.5" />
      <span>ATS {score}</span>
    </div>
  )
}
