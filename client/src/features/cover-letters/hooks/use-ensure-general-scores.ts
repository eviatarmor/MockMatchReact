import { useEffect, useRef } from "react"
import { useRegionPreferences } from "@/hooks/use-region-preferences"
import { computeCoverLetterGeneralScore } from "@/features/cover-letter-editor/lib/general-analysis"
import { parseCoverLetterDocument } from "@/features/cover-letter-editor/hooks/use-cover-letter-editor-session"
import { trpc } from "@/lib/trpc"
import type { CoverLetterItem } from "../types"

/**
 * Backfill null list scores using the same pipeline as the editor general analysis.
 * Runs once per letter id while the lab is open.
 */
export function useEnsureGeneralScores(items: readonly CoverLetterItem[]) {
  const utils = trpc.useUtils()
  const { dialect, isLoading: regionLoading } = useRegionPreferences()
  const update = trpc.coverLetters.update.useMutation()
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
          const detail = await utils.coverLetters.get.fetch({ id })
          const document = parseCoverLetterDocument(detail.document)
          const generalScore = await computeCoverLetterGeneralScore(
            document,
            dialect
          )
          if (cancelled) return
          await update.mutateAsync({ id, generalScore })
          wrote = true
        } catch {
          attempted.current.delete(id)
        }
      }
      if (wrote && !cancelled) {
        await utils.coverLetters.list.invalidate().catch(() => {})
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey, dialect, regionLoading])
}
