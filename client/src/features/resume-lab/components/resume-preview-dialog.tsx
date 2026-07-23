import { useTranslation } from "react-i18next"
import { DocumentPreviewDialog } from "@/components/data/document-preview-dialog"
import { ResumeDocumentPreview } from "@/features/resume-editor/components/resume-document-preview"

interface ResumePreviewDialogProps {
  readonly resumeId: string | null
  readonly title: string
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/** Table-row preview: read-only {@link ResumeDocumentView} in a dialog. */
export function ResumePreviewDialog({
  resumeId,
  title,
  open,
  onOpenChange,
}: ResumePreviewDialogProps) {
  const { t } = useTranslation("common")

  return (
    <DocumentPreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={t("resumeLab.table.preview.description")}
    >
      {resumeId ? (
        <ResumeDocumentPreview resumeId={resumeId} enabled={open} variant="preview" />
      ) : null}
    </DocumentPreviewDialog>
  )
}
