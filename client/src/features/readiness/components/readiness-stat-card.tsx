import { Briefcase, Mic2, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = { Briefcase, Mic2, Sparkles }

interface ReadinessStatCardProps {
  readonly icon: string
  readonly value: number | string
  readonly label: string
  readonly sublabel: string
}

export function ReadinessStatCard({ icon, value, label, sublabel }: ReadinessStatCardProps) {
  const Icon = ICON_MAP[icon] ?? Briefcase
  return (
    <div className="flex items-start justify-between rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">
          {value}{" "}
          <span className="text-sm font-normal text-muted-foreground">{sublabel}</span>
        </p>
      </div>
      <Icon className="size-5 text-muted-foreground/50" />
    </div>
  )
}
