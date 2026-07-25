import { useEffect, useRef } from "react"
import { useRegionPreferences } from "@/hooks/use-region-preferences"
import { computeResumeGeneralScore } from "@/features/resume-editor/lib/general-analysis"
import { parseResumeDocument } from "@/features/resume-editor/lib/parse-resume-document"
import { trpc } from "@/lib/trpc"
import type { ResumeItem } from "../types"

/**
 * Backfill null list scores using the same pipeline as the editor general analysis.
 * Runs once per resume id while the lab is open.
 */
export function useEnsureGeneralScores(items: readonly ResumeItem[]) {
  const utils = trpc.useUtils()
  const { dialect, isLoading: regionLoading } = useRegionPreferences()
  const update = trpc.resumes.update.useMutation()
  const attempted = useRef(new Set<string>())

  const missingKey = items
    .filter((i) => i.generalScore == null)
    .map((i) => i.id)
    .join("|")

  useEffect(() => {
    if (regionLoading || !missingKey) return

    const missing = missingKey.split("|").filter(Boolean)
    let cancelled = false

    void (async () => {
      let wrote = false
      for (const id of missing) {
        if (cancelled) return
        if (attempted.current.has(id)) continue
        attempted.current.add(id)
        try {
          const detail = await utils.resumes.get.fetch({ id })
          const document = parseResumeDocument(detail.document)
          const generalScore = await computeResumeGeneralScore(document, dialect)
          if (cancelled) return
          await update.mutateAsync({ id, generalScore })
          wrote = true
        } catch {
          // Allow retry on next mount / list change
          attempted.current.delete(id)
        }
      }
      if (wrote && !cancelled) {
        await utils.resumes.list.invalidate().catch(() => {})
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when missing ids / dialect change
  }, [missingKey, dialect, regionLoading])
}
