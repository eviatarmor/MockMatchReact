import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { SessionTableRow } from "./session-table-row"
import type { RecentSession } from "../types"

interface SessionTableProps {
  readonly sessions: readonly RecentSession[]
  readonly onDelete: (session: RecentSession) => void
  readonly deletingId?: string | null
  readonly isColumnVisible?: (columnId: string) => boolean
}

export function SessionTable({
  sessions,
  onDelete,
  deletingId,
  isColumnVisible = () => true,
}: SessionTableProps) {
  const { t } = useTranslation("common")

  const allColumns: EntityTableColumn[] = useMemo(
    () => [
      {
        key: "session",
        label: t("simulations.recentSessions.columns.session"),
      },
      {
        key: "score",
        label: t("simulations.recentSessions.columns.score"),
        className: "text-center",
      },
      {
        key: "status",
        label: t("simulations.recentSessions.columns.status"),
      },
      {
        key: "updated",
        label: t("simulations.recentSessions.columns.updated"),
        className: "hidden sm:table-cell",
      },
      { key: "actions", className: "text-right w-12" },
    ],
    [t]
  )

  const columns = useMemo(
    () => allColumns.filter((column) => isColumnVisible(column.key)),
    [allColumns, isColumnVisible]
  )

  return (
    <EntityTable columns={columns} isEmpty={false} emptyMessage="">
      {sessions.map((session) => (
        <SessionTableRow
          key={session.id}
          session={session}
          onDelete={() => onDelete(session)}
          isDeleting={deletingId === session.id}
          isColumnVisible={isColumnVisible}
        />
      ))}
    </EntityTable>
  )
}
