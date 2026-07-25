import { useEffect, useRef } from "react"
import { trpc } from "@/lib/trpc"
import { useGeneralAnalysis } from "./use-general-analysis"
import type { ResumeDocument } from "../types"

const PERSIST_DEBOUNCE_MS = 500

/**
 * Keeps list `generalScore` equal to editor general analysis (structure + grammar).
 * Runs while the editor is open so lab matches the panel even before a content edit.
 */
export function useSyncGeneralScore(
  resumeId: string,
  document: ResumeDocument,
  enabled: boolean
) {
  const { score, isLinting } = useGeneralAnalysis(document, enabled)
  const utils = trpc.useUtils()
  const update = trpc.resumes.update.useMutation()
  const lastSent = useRef<number | null>(null)
  const entityRef = useRef(resumeId)

  useEffect(() => {
    if (entityRef.current !== resumeId) {
      entityRef.current = resumeId
      lastSent.current = null
    }
  }, [resumeId])

  useEffect(() => {
    if (!enabled || isLinting) return
    if (lastSent.current === score) return

    const timer = window.setTimeout(() => {
      lastSent.current = score
      update.mutate(
        { id: resumeId, generalScore: score },
        {
          onSuccess: () => {
            utils.resumes.list.invalidate().catch(() => {})
          },
        }
      )
    }, PERSIST_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutate/utils stable enough; score/isLinting drive sync
  }, [enabled, isLinting, score, resumeId])
}
