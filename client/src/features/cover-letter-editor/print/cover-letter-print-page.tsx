import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { usePrintReady } from "@/hooks/use-print-ready"
import { trpc } from "@/lib/trpc"
import { CoverLetterDocumentPreview } from "../components/cover-letter-document-preview"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Bare cover letter page for jobs / PDF export — no editor chrome.
 * Route: `/cover-letters/:letterId/print`
 */
export function CoverLetterPrintPageContent() {
  const { letterId } = useParams<{ letterId: string }>()
  const isValidId = typeof letterId === "string" && UUID_RE.test(letterId)

  const query = trpc.coverLetters.get.useQuery(
    { id: letterId! },
    { enabled: isValidId, retry: false }
  )

  usePrintReady(isValidId && query.isSuccess && Boolean(query.data))

  useEffect(() => {
    if (query.data?.title) {
      document.title = `${query.data.title} — MockMatch`
    }
  }, [query.data?.title])

  if (!letterId) return null

  return <CoverLetterDocumentPreview letterId={letterId} variant="print" />
}
