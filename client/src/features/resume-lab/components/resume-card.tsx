import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DocumentThumbnailCard } from "@/components/data/document-thumbnail-card"
import { ResumeDocumentPreview } from "@/features/resume-editor/components/resume-document-preview"
import type { ResumeItem } from "../types"

interface ResumeCardProps {
  readonly resume: ResumeItem
  readonly index: number
  readonly onDelete: () => void
  readonly onExport: () => void
  readonly onDuplicate: () => void
  readonly onPreview: () => void
  readonly isDeleting?: boolean
  readonly isExporting?: boolean
  readonly isDuplicating?: boolean
}

export function ResumeCard({
  resume,
  index,
  onDelete,
  onExport,
  onDuplicate,
  onPreview,
  isDeleting,
  isExporting,
  isDuplicating,
}: ResumeCardProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const subtitle = resume.company ?? resume.targetRole ?? t("resumeLab.table.noTargetRole")
  const openEditor = () => navigate(`/resumes/${resume.id}`)

  return (
    <DocumentThumbnailCard
      title={resume.title}
      subtitle={subtitle}
      score={resume.generalScore}
      status={resume.status}
      updatedAt={resume.updatedAt}
      translationPrefix="resumeLab.table"
      statusTranslationPrefix="resumeLab.table.statusLabels"
      index={index}
      onOpen={openEditor}
      onPreview={onPreview}
      onDelete={onDelete}
      onExport={onExport}
      onDuplicate={onDuplicate}
      isDeleting={isDeleting}
      isExporting={isExporting}
      isDuplicating={isDuplicating}
      document={
        <ResumeDocumentPreview resumeId={resume.id} variant="thumbnail" />
      }
    />
  )
}
