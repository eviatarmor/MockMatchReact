import type { ReactNode } from "react"
import { Badge } from "@mockmatch/ui/badge"
import { cn } from "@/lib/utils"

// Semantic states mapped onto the built-in shadcn Badge variants — no custom
// colors. Every badge in the app renders through one of these variants so they
// look identical on every page.
export type BadgeTone = "positive" | "warning" | "critical" | "muted"

const TONE_VARIANT: Record<BadgeTone, "default" | "secondary" | "destructive" | "outline"> = {
  positive: "default",
  warning: "secondary",
  critical: "destructive",
  muted: "outline",
}

interface ToneBadgeProps {
  readonly tone: BadgeTone
  readonly children: ReactNode
  readonly className?: string
}

export function ToneBadge({ tone, children, className }: ToneBadgeProps) {
  return (
    <Badge variant={TONE_VARIANT[tone]} className={cn("text-2xs font-medium", className)}>
      {children}
    </Badge>
  )
}
