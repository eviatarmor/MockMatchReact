import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { usePrintReady } from "@/hooks/use-print-ready"
import { trpc } from "@/lib/trpc"
import { ResumeDocumentPreview } from "../components/resume-document-preview"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Bare résumé page for jobs / PDF export — no editor chrome.
 * Route: `/resumes/:resumeId/print`
 */
export function ResumePrintPageContent() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const isValidId = typeof resumeId === "string" && UUID_RE.test(resumeId)

  const query = trpc.resumes.get.useQuery(
    { id: resumeId! },
    { enabled: isValidId, retry: false }
  )

  usePrintReady(isValidId && query.isSuccess && Boolean(query.data))

  useEffect(() => {
    if (query.data?.title) {
      document.title = `${query.data.title} — MockMatch`
    }
  }, [query.data?.title])

  if (!resumeId) return null

  return <ResumeDocumentPreview resumeId={resumeId} variant="print" />
}
