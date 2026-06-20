import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { BADGE_TONES, type BadgeTone } from "./badge-tones"

interface ToneBadgeProps {
  readonly tone: BadgeTone
  readonly children: ReactNode
}

// Outline badge tinted with a semantic tone. The single place that pairs a tone
// with the shared color tokens.
export function ToneBadge({ tone, children }: ToneBadgeProps) {
  return (
    <Badge variant="outline" className={BADGE_TONES[tone]}>
      {children}
    </Badge>
  )
}
