import { useState } from "react"
import { CoverLetterCard } from "./cover-letter-card"
import { CoverLetterPreviewDialog } from "./cover-letter-preview-dialog"
import type { CoverLetterItem } from "../types"

interface CoverLetterCardGridProps {
  readonly coverLetters: CoverLetterItem[]
  readonly onDelete: (coverLetter: CoverLetterItem) => void
  readonly onExport: (coverLetter: CoverLetterItem) => void
  readonly onDuplicate: (coverLetter: CoverLetterItem) => void
  readonly deletingId?: string | null
  readonly exportingId?: string | null
  readonly duplicatingId?: string | null
}

export function CoverLetterCardGrid({
  coverLetters,
  onDelete,
  onExport,
  onDuplicate,
  deletingId,
  exportingId,
  duplicatingId,
}: CoverLetterCardGridProps) {
  const [preview, setPreview] = useState<{ id: string; title: string } | null>(null)

  return (
    <>
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(12rem,14rem))] justify-start gap-3">
        {coverLetters.map((coverLetter, index) => (
          <CoverLetterCard
            key={coverLetter.id}
            coverLetter={coverLetter}
            index={index}
            onDelete={() => onDelete(coverLetter)}
            onExport={() => onExport(coverLetter)}
            onDuplicate={() => onDuplicate(coverLetter)}
            onPreview={() =>
              setPreview({ id: coverLetter.id, title: coverLetter.title })
            }
            isDeleting={deletingId === coverLetter.id}
            isExporting={exportingId === coverLetter.id}
            isDuplicating={duplicatingId === coverLetter.id}
          />
        ))}
      </div>

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
