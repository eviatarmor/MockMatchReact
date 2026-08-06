import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { useVisibleEntityColumns } from "@/hooks/use-visible-entity-columns"
import { ApplicationsTableRow } from "./applications-table-row"
import type { TrackedJob, TrackingStatus } from "../types"

interface ApplicationsTableProps {
  readonly jobs: TrackedJob[]
  readonly onStatusChange: (id: string, status: TrackingStatus) => void
  readonly onRemove: (id: string) => void
  readonly isColumnVisible?: (columnId: string) => boolean
}

export function ApplicationsTable({
  jobs,
  onStatusChange,
  onRemove,
  isColumnVisible = () => true,
}: ApplicationsTableProps) {
  const { t } = useTranslation("common")

  const allColumns: EntityTableColumn[] = useMemo(
    () => [
      { key: "job", label: t("applications.table.columns.job") },
      { key: "status", label: t("applications.table.columns.status") },
      {
        key: "match",
        label: t("applications.table.columns.match"),
        className: "text-center",
      },
      {
        key: "location",
        label: t("applications.table.columns.location"),
        className: "hidden md:table-cell",
      },
      {
        key: "nextStep",
        label: t("applications.table.columns.nextStep"),
        className: "hidden lg:table-cell",
      },
      { key: "actions", className: "text-right w-12" },
    ],
    [t]
  )

  const columns = useVisibleEntityColumns(allColumns, isColumnVisible)

  return (
    <EntityTable columns={columns} isEmpty={false} emptyMessage="">
      {jobs.map((job) => (
        <ApplicationsTableRow
          key={job.id}
          job={job}
          onStatusChange={(status) => onStatusChange(job.id, status)}
          onRemove={() => onRemove(job.id)}
          isColumnVisible={isColumnVisible}
        />
      ))}
    </EntityTable>
  )
}
