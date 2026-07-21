import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { AlertCircle, Loader2 } from "lucide-react"
import { resolveStyleClasses } from "@/components/document-editor"
import { usePrintReady } from "@/hooks/use-print-ready"
import { parseDocumentStyle } from "@/lib/parse-document-style"
import { trpc } from "@/lib/trpc"
import { ResumeDocumentView } from "../canvas/resume-document"
import { EDITOR_TEMPLATES } from "../constants"
import {
  parseEditorTemplateId,
  parseResumeDocument,
} from "../hooks/use-resume-editor-session"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Bare résumé page for jobs / PDF export — no editor chrome.
 * Route: `/resumes/:resumeId/print`
 */
export function ResumePrintPageContent() {
  const { t } = useTranslation("resume-editor")
  const { resumeId } = useParams<{ resumeId: string }>()
  const isValidId = typeof resumeId === "string" && UUID_RE.test(resumeId)

  const query = trpc.resumes.get.useQuery(
    { id: resumeId! },
    { enabled: isValidId, retry: false }
  )

  const ready = isValidId && query.isSuccess && Boolean(query.data)
  usePrintReady(ready)

  const view = useMemo(() => {
    if (!query.data) return null
    const templateId = parseEditorTemplateId(query.data.templateId)
    const template =
      EDITOR_TEMPLATES.find((item) => item.id === templateId) ?? EDITOR_TEMPLATES[0]
    const style = resolveStyleClasses(
      parseDocumentStyle(query.data.style, template.defaultStyle)
    )
    const document = parseResumeDocument(query.data.document)
    return { template, style, document, title: query.data.title }
  }, [query.data])

  useEffect(() => {
    if (view?.title) {
      document.title = `${view.title} — MockMatch`
    }
  }, [view?.title])

  if (!isValidId) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
        <AlertCircle className="size-5" />
        {t("notFound")}
      </div>
    )
  }

  if (query.isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("loading")}
      </div>
    )
  }

  if (query.isError || !view) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
        <AlertCircle className="size-5 text-destructive" />
        {t("loadError")}
      </div>
    )
  }

  return (
    <div className="print-surface flex min-h-svh justify-center bg-neutral-200 py-8 print:bg-white print:py-0">
      <ResumeDocumentView
        document={view.document}
        template={view.template}
        style={view.style}
        print
      />
    </div>
  )
}
