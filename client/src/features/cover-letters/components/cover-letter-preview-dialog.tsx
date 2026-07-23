import { useTranslation } from "react-i18next"
import { DocumentPreviewDialog } from "@/components/data/document-preview-dialog"
import { CoverLetterDocumentPreview } from "@/features/cover-letter-editor/components/cover-letter-document-preview"

interface CoverLetterPreviewDialogProps {
  readonly letterId: string | null
  readonly title: string
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/** Table-row preview: read-only {@link LetterDocument} in a dialog. */
export function CoverLetterPreviewDialog({
  letterId,
  title,
  open,
  onOpenChange,
}: CoverLetterPreviewDialogProps) {
  const { t } = useTranslation("common")

  return (
    <DocumentPreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={t("coverLetters.table.preview.description")}
    >
      {letterId ? (
        <CoverLetterDocumentPreview letterId={letterId} enabled={open} variant="preview" />
      ) : null}
    </DocumentPreviewDialog>
  )
}
