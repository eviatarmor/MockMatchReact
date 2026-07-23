import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { AlertCircle, Loader2 } from "lucide-react"
import { resolveStyleClasses } from "@/components/document-editor"
import { parseDocumentStyle } from "@/lib/parse-document-style"
import { trpc } from "@/lib/trpc"
import { LetterDocument } from "../canvas/letter-document"
import { EDITOR_TEMPLATES } from "../constants"
import {
  parseCoverLetterDocument,
  parseEditorTemplateId,
} from "../hooks/use-cover-letter-editor-session"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface CoverLetterDocumentPreviewProps {
  readonly letterId: string
  /** When false, skips the fetch (e.g. closed dialog). */
  readonly enabled?: boolean
  /**
   * `preview` — read-only document card with page shadow (table dialog).
   * `print` — bare surface for PDF / browser print (no shadow).
   */
  readonly variant?: "preview" | "print"
}

/**
 * Loads a cover letter and renders {@link LetterDocument} read-only.
 * Used by the lab preview dialog and the bare `/print` route.
 */
export function CoverLetterDocumentPreview({
  letterId,
  enabled = true,
  variant = "preview",
}: CoverLetterDocumentPreviewProps) {
  const { t } = useTranslation("cover-letter-editor")
  const isValidId = UUID_RE.test(letterId)
  const isPrint = variant === "print"

  const query = trpc.coverLetters.get.useQuery(
    { id: letterId },
    { enabled: enabled && isValidId, retry: false }
  )

  const view = useMemo(() => {
    if (!query.data) return null
    const templateId = parseEditorTemplateId(query.data.templateId)
    const template =
      EDITOR_TEMPLATES.find((item) => item.id === templateId) ?? EDITOR_TEMPLATES[0]
    const style = resolveStyleClasses(
      parseDocumentStyle(query.data.style, template.defaultStyle)
    )
    return {
      template,
      style,
      document: parseCoverLetterDocument(query.data.document),
    }
  }, [query.data])

  const shell = isPrint
    ? "flex min-h-svh items-center justify-center gap-2 p-8 text-sm text-muted-foreground"
    : "flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground"

  if (!isValidId) {
    return (
      <div className={shell}>
        <AlertCircle className="size-5" />
        {t("notFound")}
      </div>
    )
  }

  if ((query.isLoading || query.isFetching) && !view) {
    return (
      <div className={shell}>
        <Loader2 className="size-4 animate-spin" />
        {t("loading")}
      </div>
    )
  }

  if (query.isError || !view) {
    return (
      <div className={shell}>
        <AlertCircle className="size-5 text-destructive" />
        {t("loadError")}
      </div>
    )
  }

  return (
    <div
      className={
        isPrint
          ? "print-surface flex min-h-svh justify-center bg-neutral-200 py-8 print:bg-white print:py-0"
          : "flex justify-center bg-neutral-100 py-6 dark:bg-neutral-950"
      }
    >
      <LetterDocument
        document={view.document}
        template={view.template}
        style={view.style}
        print={isPrint}
      />
    </div>
  )
}
