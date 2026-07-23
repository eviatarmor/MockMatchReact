import { useState } from "react"
import { useTranslation } from "react-i18next"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { CoverLetterPreviewDialog } from "./cover-letter-preview-dialog"
import { CoverLetterTableRow } from "./cover-letter-table-row"
import type { CoverLetterItem } from "../types"

interface CoverLetterTableProps {
  readonly coverLetters: CoverLetterItem[]
  readonly onDelete: (coverLetter: CoverLetterItem) => void
  readonly onExport: (coverLetter: CoverLetterItem) => void
  readonly onDuplicate: (coverLetter: CoverLetterItem) => void
  readonly deletingId?: string | null
  readonly exportingId?: string | null
  readonly duplicatingId?: string | null
}

export function CoverLetterTable({
  coverLetters,
  onDelete,
  onExport,
  onDuplicate,
  deletingId,
  exportingId,
  duplicatingId,
}: CoverLetterTableProps) {
  const { t } = useTranslation("common")
  const [preview, setPreview] = useState<{ id: string; title: string } | null>(null)

  const columns: EntityTableColumn[] = [
    { key: "coverLetter", label: t("coverLetters.table.columns.coverLetter") },
    { key: "status", label: t("coverLetters.table.columns.status") },
    { key: "updated", label: t("coverLetters.table.columns.updated"), className: "hidden sm:table-cell" },
    { key: "actions", className: "text-right w-12" },
  ]

  return (
    <>
      <EntityTable columns={columns} isEmpty={false} emptyMessage="">
        {coverLetters.map((coverLetter) => (
          <CoverLetterTableRow
            key={coverLetter.id}
            coverLetter={coverLetter}
            onDelete={() => onDelete(coverLetter)}
            onExport={() => onExport(coverLetter)}
            onDuplicate={() => onDuplicate(coverLetter)}
            onPreview={() => setPreview({ id: coverLetter.id, title: coverLetter.title })}
            isDeleting={deletingId === coverLetter.id}
            isExporting={exportingId === coverLetter.id}
            isDuplicating={duplicatingId === coverLetter.id}
          />
        ))}
      </EntityTable>

      <CoverLetterPreviewDialog
        letterId={preview?.id ?? null}
        title={preview?.title ?? ""}
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
      />
    </>
  )
}
