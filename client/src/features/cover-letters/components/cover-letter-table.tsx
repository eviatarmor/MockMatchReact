import { useTranslation } from "react-i18next"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { CoverLetterTableRow } from "./cover-letter-table-row"
import type { CoverLetterItem } from "../types"

interface CoverLetterTableProps {
  readonly coverLetters: CoverLetterItem[]
  readonly onDelete: (coverLetter: CoverLetterItem) => void
  readonly deletingId?: string | null
}

export function CoverLetterTable({
  coverLetters,
  onDelete,
  deletingId,
}: CoverLetterTableProps) {
  const { t } = useTranslation("common")

  const columns: EntityTableColumn[] = [
    { key: "coverLetter", label: t("coverLetters.table.columns.coverLetter") },
    { key: "status", label: t("coverLetters.table.columns.status") },
    { key: "updated", label: t("coverLetters.table.columns.updated"), className: "hidden sm:table-cell" },
    { key: "actions", className: "text-right w-12" },
  ]

  return (
    <EntityTable columns={columns} isEmpty={false} emptyMessage="">
      {coverLetters.map((coverLetter) => (
        <CoverLetterTableRow
          key={coverLetter.id}
          coverLetter={coverLetter}
          onDelete={() => onDelete(coverLetter)}
          isDeleting={deletingId === coverLetter.id}
        />
      ))}
    </EntityTable>
  )
}
