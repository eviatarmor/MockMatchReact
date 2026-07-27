import { useTranslation } from "react-i18next"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { SessionTableRow } from "./session-table-row"
import type { RecentSession } from "../types"

interface SessionTableProps {
  readonly sessions: readonly RecentSession[]
}

export function SessionTable({ sessions }: SessionTableProps) {
  const { t } = useTranslation("common")

  const columns: EntityTableColumn[] = [
    { key: "role", label: t("simulations.recentSessions.columns.role") },
    {
      key: "track",
      label: t("simulations.recentSessions.columns.track"),
      className: "hidden sm:table-cell",
    },
    {
      key: "date",
      label: t("simulations.recentSessions.columns.date"),
      className: "hidden md:table-cell",
    },
    { key: "duration", label: t("simulations.recentSessions.columns.duration") },
    { key: "score", label: t("simulations.recentSessions.columns.score") },
    { key: "status", label: t("simulations.recentSessions.columns.status") },
  ]

  return (
    <EntityTable columns={columns} isEmpty={false} emptyMessage="">
      {sessions.map((session) => (
        <SessionTableRow key={session.id} session={session} />
      ))}
    </EntityTable>
  )
}
