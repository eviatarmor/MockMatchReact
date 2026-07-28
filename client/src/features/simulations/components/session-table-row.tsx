import { useTranslation } from "react-i18next"
import { Badge } from "@mockmatch/ui/badge"
import type { RecentSession, SessionStatus } from "../types"

function statusVariant(status: SessionStatus): "outline" | "secondary" | "default" {
  if (status === "completed") return "outline"
  if (status === "in_progress") return "default"
  return "secondary"
}

interface SessionTableRowProps {
  readonly session: RecentSession
}

export function SessionTableRow({ session }: SessionTableRowProps) {
  const { t } = useTranslation("common")

  return (
    <tr className="group border-b border-border/40 transition-colors hover:bg-muted/5">
      <td className="py-3 px-4">
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm text-foreground truncate">
            {session.role}
          </span>
          <span className="text-xs text-muted-foreground truncate sm:hidden">
            {session.track}
          </span>
        </div>
      </td>

      <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
        {session.track}
      </td>

      <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
        {session.date}
      </td>

      <td className="py-3 px-4 text-sm text-muted-foreground">
        {session.durationMin} {t("simulations.recentSessions.durationSuffix")}
      </td>

      <td className="py-3 px-4 text-sm">
        {session.score !== null ? (
          <span className="font-medium tabular-nums">{session.score}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      <td className="py-3 px-4">
        <Badge variant={statusVariant(session.status)}>
          {t(`simulations.recentSessions.statusLabels.${session.status}`)}
        </Badge>
      </td>
    </tr>
  )
}
