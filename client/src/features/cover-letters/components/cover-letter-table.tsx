import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { useVisibleEntityColumns } from "@/hooks/use-visible-entity-columns"
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
  readonly isColumnVisible?: (columnId: string) => boolean
}

export function CoverLetterTable({
  coverLetters,
  onDelete,
  onExport,
  onDuplicate,
  deletingId,
  exportingId,
  duplicatingId,
  isColumnVisible = () => true,
}: CoverLetterTableProps) {
  const { t } = useTranslation("common")
  const [preview, setPreview] = useState<{ id: string; title: string } | null>(null)

  const allColumns: EntityTableColumn[] = useMemo(
    () => [
      { key: "coverLetter", label: t("coverLetters.table.columns.coverLetter") },
      { key: "score", label: t("coverLetters.table.columns.score"), className: "text-center" },
      { key: "status", label: t("coverLetters.table.columns.status") },
      {
        key: "updated",
        label: t("coverLetters.table.columns.updated"),
        className: "hidden sm:table-cell",
      },
      { key: "actions", className: "text-right w-12" },
    ],
    [t]
  )

  const columns = useVisibleEntityColumns(allColumns, isColumnVisible)

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
            onPreview={() =>
              setPreview({ id: coverLetter.id, title: coverLetter.title })
            }
            isDeleting={deletingId === coverLetter.id}
            isExporting={exportingId === coverLetter.id}
            isDuplicating={duplicatingId === coverLetter.id}
            isColumnVisible={isColumnVisible}
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
