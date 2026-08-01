import { useTranslation } from "react-i18next"
import { Badge } from "@mockmatch/ui/badge"
import { cn } from "@/lib/utils"
import type { SessionStatus } from "../types"

interface SessionStatusBadgeProps {
  readonly status: SessionStatus
  readonly className?: string
}

/** Session lifecycle pill — mirrors DocumentStatusBadge styling. */
export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const { t } = useTranslation("common")

  return (
    <Badge
      variant={status === "in_progress" ? "default" : "outline"}
      className={cn("text-2xs font-medium", className)}
    >
      {t(`simulations.recentSessions.statusLabels.${status}`)}
    </Badge>
  )
}
