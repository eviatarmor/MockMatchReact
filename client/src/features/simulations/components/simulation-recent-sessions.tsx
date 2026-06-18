import { useTranslation } from "react-i18next"
import { History } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { RecentSession, SessionStatus } from "../types"

function statusVariant(status: SessionStatus): "outline" | "secondary" | "default" {
  if (status === "completed") return "outline"
  if (status === "in_progress") return "default"
  return "secondary"
}

interface SimulationRecentSessionsProps {
  readonly sessions: readonly RecentSession[]
}

export function SimulationRecentSessions({ sessions }: SimulationRecentSessionsProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">{t("simulations.recentSessions.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("simulations.recentSessions.description")}</p>
        </div>
        <button className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <History className="size-3.5" />
          {t("simulations.recentSessions.viewAll")}
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("simulations.recentSessions.columns.role")}</TableHead>
            <TableHead>{t("simulations.recentSessions.columns.track")}</TableHead>
            <TableHead>{t("simulations.recentSessions.columns.date")}</TableHead>
            <TableHead>{t("simulations.recentSessions.columns.duration")}</TableHead>
            <TableHead>{t("simulations.recentSessions.columns.score")}</TableHead>
            <TableHead>{t("simulations.recentSessions.columns.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="font-medium">{session.role}</TableCell>
              <TableCell className="text-muted-foreground">{session.track}</TableCell>
              <TableCell className="text-muted-foreground">{session.date}</TableCell>
              <TableCell className="text-muted-foreground">
                {session.durationMin} {t("simulations.recentSessions.durationSuffix")}
              </TableCell>
              <TableCell>
                {session.score !== null ? (
                  <span className="font-medium">{session.score}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(session.status)}>
                  {t(`simulations.recentSessions.statusLabels.${session.status}`)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
