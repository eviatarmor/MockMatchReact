import { useEffect, useRef } from "react"
import { useRegionPreferences } from "@/hooks/use-region-preferences"
import { computeResumeGeneralScore } from "@/features/resume-editor/lib/general-analysis"
import { parseResumeDocument } from "@/features/resume-editor/lib/parse-resume-document"
import { trpc } from "@/lib/trpc"
import type { ResumeItem } from "../types"

/** Let list entrance animations finish before Harper/scoring steals the main thread. */
const SCORE_BACKFILL_DELAY_MS = 600

/**
 * Backfill null list scores using the same pipeline as the editor general analysis.
 * Runs once per resume id while the lab is open.
 *
 * Deferred: scores use Harper on the main thread; running them during mount
 * caused setTimeout / animation violations on the lab grid.
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
    let idleId: number | undefined
    let timeoutId: number | undefined

    const run = () => {
      void (async () => {
        let wrote = false
        for (const id of missing) {
          if (cancelled) return
          if (attempted.current.has(id)) continue
          attempted.current.add(id)
          try {
            // Yield between items so input / animation frames can run
            await new Promise<void>((resolve) => {
              if (typeof requestIdleCallback === "function") {
                requestIdleCallback(() => resolve(), { timeout: 2000 })
              } else {
                window.setTimeout(() => resolve(), 0)
              }
            })
            if (cancelled) return

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
    }

    // First wait past stagger entrance, then start on idle if available
    timeoutId = window.setTimeout(() => {
      if (cancelled) return
      if (typeof requestIdleCallback === "function") {
        idleId = requestIdleCallback(run, { timeout: 3000 })
      } else {
        run()
      }
    }, SCORE_BACKFILL_DELAY_MS)

    return () => {
      cancelled = true
      if (timeoutId != null) window.clearTimeout(timeoutId)
      if (idleId != null && typeof cancelIdleCallback === "function") {
        cancelIdleCallback(idleId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when missing ids / dialect change
  }, [missingKey, dialect, regionLoading])
}
