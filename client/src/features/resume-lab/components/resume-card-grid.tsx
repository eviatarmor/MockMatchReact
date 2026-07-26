import { useState } from "react"
import { ResumeCard } from "./resume-card"
import { ResumePreviewDialog } from "./resume-preview-dialog"
import type { ResumeItem } from "../types"

interface ResumeCardGridProps {
  readonly resumes: ResumeItem[]
  readonly onDelete: (resume: ResumeItem) => void
  readonly onExport: (resume: ResumeItem) => void
  readonly onDuplicate: (resume: ResumeItem) => void
  readonly deletingId?: string | null
  readonly exportingId?: string | null
  readonly duplicatingId?: string | null
}

export function ResumeCardGrid({
  resumes,
  onDelete,
  onExport,
  onDuplicate,
  deletingId,
  exportingId,
  duplicatingId,
}: ResumeCardGridProps) {
  const [preview, setPreview] = useState<{ id: string; title: string } | null>(null)

  return (
    <>
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(12rem,14rem))] justify-start gap-3">
        {resumes.map((resume, index) => (
          <ResumeCard
            key={resume.id}
            resume={resume}
            index={index}
            onDelete={() => onDelete(resume)}
            onExport={() => onExport(resume)}
            onDuplicate={() => onDuplicate(resume)}
            onPreview={() => setPreview({ id: resume.id, title: resume.title })}
            isDeleting={deletingId === resume.id}
            isExporting={exportingId === resume.id}
            isDuplicating={duplicatingId === resume.id}
          />
        ))}
      </div>

      <ResumePreviewDialog
        resumeId={preview?.id ?? null}
        title={preview?.title ?? ""}
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
      />
    </>
  )
}
