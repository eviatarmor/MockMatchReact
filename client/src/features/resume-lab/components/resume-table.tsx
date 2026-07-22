import { useTranslation } from "react-i18next"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { ResumeTableRow } from "./resume-table-row"
import type { ResumeItem } from "../types"

interface ResumeTableProps {
  readonly resumes: ResumeItem[]
  readonly onDelete: (resume: ResumeItem) => void
  readonly onExport: (resume: ResumeItem) => void
  readonly onDuplicate: (resume: ResumeItem) => void
  readonly deletingId?: string | null
  readonly exportingId?: string | null
  readonly duplicatingId?: string | null
}

export function ResumeTable({
  resumes,
  onDelete,
  onExport,
  onDuplicate,
  deletingId,
  exportingId,
  duplicatingId,
}: ResumeTableProps) {
  const { t } = useTranslation("common")

  const columns: EntityTableColumn[] = [
    { key: "resume", label: t("resumeLab.table.columns.resume") },
    { key: "ats", label: t("resumeLab.table.columns.ats"), className: "text-center" },
    { key: "status", label: t("resumeLab.table.columns.status") },
    { key: "updated", label: t("resumeLab.table.columns.updated"), className: "hidden sm:table-cell" },
    { key: "actions", className: "text-right w-12" },
  ]

  return (
    <EntityTable columns={columns} isEmpty={false} emptyMessage="">
      {resumes.map((resume) => (
        <ResumeTableRow
          key={resume.id}
          resume={resume}
          onDelete={() => onDelete(resume)}
          onExport={() => onExport(resume)}
          onDuplicate={() => onDuplicate(resume)}
          isDeleting={deletingId === resume.id}
          isExporting={exportingId === resume.id}
          isDuplicating={duplicatingId === resume.id}
        />
      ))}
    </EntityTable>
  )
}
