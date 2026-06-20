import { useTranslation } from "react-i18next"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { ResumeTableRow } from "./resume-table-row"
import type { ResumeItem } from "../types"

interface ResumeTableProps {
  readonly resumes: ResumeItem[]
}

export function ResumeTable({ resumes }: ResumeTableProps) {
  const { t } = useTranslation("common")

  const columns: EntityTableColumn[] = [
    { key: "resume", label: t("resumeLab.table.columns.resume") },
    { key: "ats", label: t("resumeLab.table.columns.ats"), className: "text-center" },
    { key: "status", label: t("resumeLab.table.columns.status") },
    { key: "updated", label: t("resumeLab.table.columns.updated"), className: "hidden sm:table-cell" },
    { key: "actions", className: "text-right w-12" },
  ]

  return (
    <EntityTable columns={columns} isEmpty={resumes.length === 0} emptyMessage="No resumes found">
      {resumes.map((resume) => (
        <ResumeTableRow key={resume.id} resume={resume} />
      ))}
    </EntityTable>
  )
}
