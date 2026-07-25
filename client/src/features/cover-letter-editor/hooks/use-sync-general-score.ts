import { useEffect, useRef } from "react"
import { trpc } from "@/lib/trpc"
import { useGeneralAnalysis } from "./use-general-analysis"
import type { CoverLetterDocument } from "../types"

const PERSIST_DEBOUNCE_MS = 500

/**
 * Keeps list `generalScore` equal to editor general analysis (structure + grammar).
 * Runs while the editor is open so lab matches the panel even before a content edit.
 */
export function useSyncGeneralScore(
  letterId: string,
  document: CoverLetterDocument,
  enabled: boolean
) {
  const { score, isLinting } = useGeneralAnalysis(document, enabled)
  const utils = trpc.useUtils()
  const update = trpc.coverLetters.update.useMutation()
  const lastSent = useRef<number | null>(null)
  const entityRef = useRef(letterId)

  useEffect(() => {
    if (entityRef.current !== letterId) {
      entityRef.current = letterId
      lastSent.current = null
    }
  }, [letterId])

  useEffect(() => {
    if (!enabled || isLinting) return
    if (lastSent.current === score) return

    const timer = window.setTimeout(() => {
      lastSent.current = score
      update.mutate(
        { id: letterId, generalScore: score },
        {
          onSuccess: () => {
            utils.coverLetters.list.invalidate().catch(() => {})
          },
        }
      )
    }, PERSIST_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutate/utils stable enough; score/isLinting drive sync
  }, [enabled, isLinting, score, letterId])
}
