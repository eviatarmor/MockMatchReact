import { useTranslation } from "react-i18next"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { CoverLetterTableRow } from "./cover-letter-table-row"
import type { CoverLetterItem } from "../types"

interface CoverLetterTableProps {
  readonly coverLetters: CoverLetterItem[]
}

export function CoverLetterTable({ coverLetters }: CoverLetterTableProps) {
  const { t } = useTranslation("common")

  const columns: EntityTableColumn[] = [
    { key: "coverLetter", label: t("coverLetters.table.columns.coverLetter") },
    { key: "status", label: t("coverLetters.table.columns.status") },
    { key: "updated", label: t("coverLetters.table.columns.updated"), className: "hidden sm:table-cell" },
    { key: "actions", className: "text-right w-12" },
  ]

  return (
    <EntityTable columns={columns} isEmpty={coverLetters.length === 0} emptyMessage="No cover letters found">
      {coverLetters.map((coverLetter) => (
        <CoverLetterTableRow key={coverLetter.id} coverLetter={coverLetter} />
      ))}
    </EntityTable>
  )
}
