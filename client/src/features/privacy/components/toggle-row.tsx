import type { ReactNode } from "react"

interface ToggleRowProps {
  readonly label: string
  readonly description: string
  readonly control: ReactNode
  readonly badge?: ReactNode
}

// Single preference row: label + description on the left, switch (or badge) on the right.
export function ToggleRow({ label, description, control, badge }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {badge}
        </div>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <div className="shrink-0 pt-0.5">{control}</div>
    </div>
  )
}
