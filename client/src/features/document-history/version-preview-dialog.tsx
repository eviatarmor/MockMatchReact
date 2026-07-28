import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import type { DocumentKind } from "@mockmatch/schemas"
import {
  DiffHtmlProvider,
  resolveStyleClasses,
} from "@/components/document-editor"
import { DocumentPreviewDialog } from "@/components/data/document-preview-dialog"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mockmatch/ui/dialog"
import { Button } from "@mockmatch/ui/button"
import { parseDocumentStyle } from "@/lib/parse-document-style"
import { trpc } from "@/lib/trpc"
import { ResumeDocumentView } from "@/features/resume-editor/canvas/resume-document"
import { EDITOR_TEMPLATES as RESUME_TEMPLATES } from "@/features/resume-editor/constants"
import {
  parseEditorTemplateId as parseResumeTemplateId,
  parseResumeDocument,
} from "@/features/resume-editor/hooks/use-resume-editor-session"
import { LetterDocument } from "@/features/cover-letter-editor/canvas/letter-document"
import { EDITOR_TEMPLATES as LETTER_TEMPLATES } from "@/features/cover-letter-editor/constants"
import {
  parseEditorTemplateId as parseLetterTemplateId,
  parseCoverLetterDocument,
} from "@/features/cover-letter-editor/hooks/use-cover-letter-editor-session"
import { annotateDocumentDiff } from "./lib/annotate-document"

type VersionPreviewDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly kind: DocumentKind
  readonly documentId: string
  readonly versionId: string | null
  readonly canRestore: boolean
  readonly onRestored?: (detail: {
    title: string
    templateId: string
    style: unknown
    document: unknown
  }) => void
  readonly i18nNs: "resume-editor" | "cover-letter-editor"
}

/**
 * Version snapshot preview — reuses {@link DocumentPreviewDialog} shell so
 * scroll / sizing match lab resume previews.
 */
export function VersionPreviewDialog({
  open,
  onOpenChange,
  kind,
  documentId,
  versionId,
  canRestore,
  onRestored,
  i18nNs,
}: VersionPreviewDialogProps) {
  const { t } = useTranslation(i18nNs)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const utils = trpc.useUtils()

  const query = trpc.documentVersions.get.useQuery(
    { kind, id: documentId, versionId: versionId! },
    { enabled: open && Boolean(versionId), staleTime: 30_000 }
  )

  const restore = trpc.documentVersions.restore.useMutation({
    onSuccess: async (detail) => {
      toast.success(t("history.restoreSuccess"))
      await Promise.all([
        utils.documentVersions.list.invalidate({ kind, id: documentId }),
        kind === "resume"
          ? utils.resumes.get.invalidate({ id: documentId })
          : utils.coverLetters.get.invalidate({ id: documentId }),
      ])
      onRestored?.({
        title: detail.title,
        templateId: detail.templateId,
        style: detail.style,
        document: detail.document,
      })
      setConfirmOpen(false)
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(err.message || t("history.restoreError"))
    },
  })

  const preview = useMemo(() => {
    if (!query.data) return null
    const data = query.data
    const hasPrevious = Boolean(data.previous)
    const docSource = hasPrevious
      ? annotateDocumentDiff(data.document, data.previous!.document)
      : data.document

    if (kind === "resume") {
      const templateId = parseResumeTemplateId(data.templateId)
      const template =
        RESUME_TEMPLATES.find((item) => item.id === templateId) ??
        RESUME_TEMPLATES[0]!
      const style = resolveStyleClasses(
        parseDocumentStyle(data.style, template.defaultStyle)
      )
      return {
        kind: "resume" as const,
        template,
        style,
        document: parseResumeDocument(docSource),
        title: data.title,
        actorName: data.actorName,
        createdAt: data.createdAt,
        hasPrevious,
      }
    }

    const templateId = parseLetterTemplateId(data.templateId)
    const template =
      LETTER_TEMPLATES.find((item) => item.id === templateId) ??
      LETTER_TEMPLATES[0]!
    const style = resolveStyleClasses(
      parseDocumentStyle(data.style, template.defaultStyle)
    )
    return {
      kind: "cover_letter" as const,
      template,
      style,
      document: parseCoverLetterDocument(docSource),
      title: data.title,
      actorName: data.actorName,
      createdAt: data.createdAt,
      hasPrevious,
    }
  }, [query.data, kind])

  const title = preview
    ? t("history.previewTitle", {
        date: new Date(preview.createdAt).toLocaleString(),
      })
    : t("history.previewLoading")

  const description = preview
    ? t("history.previewBy", { name: preview.actorName })
    : t("history.previewDescription")

  return (
    <>
      <DocumentPreviewDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setConfirmOpen(false)
          onOpenChange(next)
        }}
        title={title}
        description={description}
        descriptionSrOnly={false}
        footer={
          canRestore ? (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer gap-1.5"
                onClick={() => setConfirmOpen(true)}
                disabled={!query.data || restore.isPending}
              >
                <RotateCcw className="size-3.5" />
                {t("history.restore")}
              </Button>
            </div>
          ) : undefined
        }
      >
        {query.isLoading && (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("history.loading")}
          </div>
        )}
        {query.isError && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {t("history.loadError")}
          </p>
        )}
        {preview && (
          <DiffHtmlProvider enabled={preview.hasPrevious}>
            <div className="flex justify-center bg-neutral-100 py-6 dark:bg-neutral-950">
              {preview.kind === "resume" ? (
                <ResumeDocumentView
                  document={preview.document}
                  template={preview.template}
                  style={preview.style}
                />
              ) : (
                <LetterDocument
                  document={preview.document}
                  template={preview.template}
                  style={preview.style}
                />
              )}
            </div>
          </DiffHtmlProvider>
        )}
      </DocumentPreviewDialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("history.restore")}</DialogTitle>
            <DialogDescription>
              {t("history.restoreConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" className="cursor-pointer" />}
            >
              {t("history.cancel")}
            </DialogClose>
            <Button
              className="cursor-pointer gap-1.5"
              disabled={restore.isPending || !versionId}
              onClick={() => {
                if (!versionId) return
                restore.mutate({
                  kind,
                  id: documentId,
                  versionId,
                })
              }}
            >
              {restore.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              {t("history.confirmRestore")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
