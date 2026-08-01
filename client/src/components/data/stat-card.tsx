import type { ReactNode } from "react"
import { resolveIcon } from "@/lib/icon-map"

interface StatDelta {
  readonly label: string
  readonly positive: boolean
}

interface StatCardProps {
  readonly iconName: string
  readonly label: string
  readonly value: ReactNode
  readonly subValue?: ReactNode
  readonly delta?: StatDelta
}

// Summary tile: label + value (optional sub-value) with a muted icon on the
// right, and an optional trend delta line. Shared across dashboard overviews.
export function StatCard({ iconName, label, value, subValue, delta }: StatCardProps) {
  const Icon = resolveIcon(iconName)

  return (
    <div className="flex items-start justify-between rounded-xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold leading-tight tabular-nums text-foreground">
          {value}
          {subValue && (
            <>
              {" "}
              <span className="text-sm font-normal text-muted-foreground">{subValue}</span>
            </>
          )}
        </p>
        {delta && (
          <p
            className={
              delta.positive
                ? "flex items-center gap-1 text-2xs text-emerald-600 dark:text-emerald-400"
                : "flex items-center gap-1 text-2xs text-rose-600 dark:text-rose-400"
            }
          >
            <span aria-hidden>{delta.positive ? "↗" : "↘"}</span>
            {delta.label}
          </p>
        )}
      </div>
      <Icon className="size-5 text-muted-foreground/50" />
    </div>
  )
}
