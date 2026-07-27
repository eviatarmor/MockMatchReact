import { useTranslation } from "react-i18next"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { ApplicationsTableRow } from "./applications-table-row"
import type { TrackedJob, TrackingStatus } from "../types"

interface ApplicationsTableProps {
  readonly jobs: TrackedJob[]
  readonly onStatusChange: (id: string, status: TrackingStatus) => void
  readonly onRemove: (id: string) => void
}

export function ApplicationsTable({
  jobs,
  onStatusChange,
  onRemove,
}: ApplicationsTableProps) {
  const { t } = useTranslation("common")

  const columns: EntityTableColumn[] = [
    { key: "job", label: t("applications.table.columns.job") },
    { key: "status", label: t("applications.table.columns.status") },
    { key: "match", label: t("applications.table.columns.match"), className: "text-center" },
    { key: "location", label: t("applications.table.columns.location"), className: "hidden md:table-cell" },
    { key: "nextStep", label: t("applications.table.columns.nextStep"), className: "hidden lg:table-cell" },
    { key: "actions", className: "text-right w-12" },
  ]

  return (
    <EntityTable columns={columns} isEmpty={false} emptyMessage="">
      {jobs.map((job) => (
        <ApplicationsTableRow
          key={job.id}
          job={job}
          onStatusChange={(status) => onStatusChange(job.id, status)}
          onRemove={() => onRemove(job.id)}
        />
      ))}
    </EntityTable>
  )
}
