import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DocumentThumbnailCard } from "@/components/data/document-thumbnail-card"
import { CoverLetterDocumentPreview } from "@/features/cover-letter-editor/components/cover-letter-document-preview"
import type { CoverLetterItem } from "../types"

interface CoverLetterCardProps {
  readonly coverLetter: CoverLetterItem
  readonly index: number
  readonly onDelete: () => void
  readonly onExport: () => void
  readonly onDuplicate: () => void
  readonly onPreview: () => void
  readonly isDeleting?: boolean
  readonly isExporting?: boolean
  readonly isDuplicating?: boolean
}

export function CoverLetterCard({
  coverLetter,
  index,
  onDelete,
  onExport,
  onDuplicate,
  onPreview,
  isDeleting,
  isExporting,
  isDuplicating,
}: CoverLetterCardProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const subtitle = coverLetter.company ?? t("coverLetters.table.noTargetRole")
  const openEditor = () => navigate(`/cover-letters/${coverLetter.id}`)

  return (
    <DocumentThumbnailCard
      title={coverLetter.title}
      subtitle={subtitle}
      score={coverLetter.generalScore}
      status={coverLetter.status}
      updatedAt={coverLetter.updatedAt}
      translationPrefix="coverLetters.table"
      statusTranslationPrefix="coverLetters.table.statusLabels"
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
        <CoverLetterDocumentPreview letterId={coverLetter.id} variant="thumbnail" />
      }
    />
  )
}
