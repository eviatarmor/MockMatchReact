import { useEffect, useMemo, useRef, useState } from "react"
import type { FitScore } from "@mockmatch/schemas"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { trpc } from "@/lib/trpc"
import type { DiscoverJob } from "../types"

const BATCH_DEBOUNCE_MS = 300

/**
 * Batch-score visible jobs via multi-resume profile.
 * Free → heuristic. Paid credits → AI when available.
 */
export function useDiscoverFitScores(jobs: readonly DiscoverJob[]) {
  const { t } = useTranslation("common")
  const [scores, setScores] = useState<Record<string, FitScore>>({})
  const [mode, setMode] = useState<"heuristic" | "ai" | "none" | null>(null)
  const [creditsRemaining, setCreditsRemaining] = useState(0)
  const toastedRef = useRef(false)
  const inFlightRef = useRef<Set<string>>(new Set())

  const scoreFits = trpc.jobs.scoreFits.useMutation({
    onSuccess: (data, variables) => {
      setMode(data.mode)
      setCreditsRemaining(data.creditsRemaining)
      setScores((prev) => ({ ...prev, ...data.scores }))
      for (const job of variables.jobs) {
        inFlightRef.current.delete(job.id)
      }

      if (
        data.mode === "heuristic" &&
        data.creditsRemaining === 0 &&
        data.resumeCount > 0 &&
        !toastedRef.current
      ) {
        // only toast once if user might expect AI (preferAi default true but free)
        // skip noise for pure free users on first load — they always get heuristic
      }

      if (data.creditsCharged > 0 && data.creditsRemaining === 0 && !toastedRef.current) {
        toastedRef.current = true
        toast.message(t("discover.fit.creditsEmptyTitle"), {
          description: t("discover.fit.creditsEmptyDescription"),
        })
      }
    },
    onError: (_err, variables) => {
      for (const job of variables.jobs) {
        inFlightRef.current.delete(job.id)
      }
    },
  })

  const unscoredKey = useMemo(() => {
    return jobs
      .filter((j) => !scores[j.id] && !inFlightRef.current.has(j.id))
      .map((j) => j.id)
      .join("|")
  }, [jobs, scores])

  useEffect(() => {
    if (!unscoredKey) return

    const timer = window.setTimeout(() => {
      const pending = jobs.filter(
        (j) => !scores[j.id] && !inFlightRef.current.has(j.id)
      )
      if (pending.length === 0) return

      const batch = pending.slice(0, 20)
      for (const j of batch) inFlightRef.current.add(j.id)

      scoreFits.mutate({
        preferAi: true,
        jobs: batch.map((j) => ({
          id: j.id,
          title: j.title,
          company: j.company,
          description: j.description.slice(0, 2000),
          category: j.category,
          location: j.location,
        })),
      })
    }, BATCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
    // scores intentionally omitted from deps — use unscoredKey + jobs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unscoredKey, jobs])

  // Reset scores when job list identity fully changes (filter reset)
  const jobIdsSignature = useMemo(
    () => jobs.map((j) => j.id).join(","),
    [jobs]
  )
  const prevSig = useRef(jobIdsSignature)
  useEffect(() => {
    // only clear scores for jobs no longer present
    if (prevSig.current === jobIdsSignature) return
    prevSig.current = jobIdsSignature
    setScores((prev) => {
      const next: Record<string, FitScore> = {}
      const idSet = new Set(jobs.map((j) => j.id))
      for (const [id, score] of Object.entries(prev)) {
        if (idSet.has(id)) next[id] = score
      }
      return next
    })
  }, [jobIdsSignature, jobs])

  return {
    scores,
    mode,
    creditsRemaining,
    isScoring: scoreFits.isPending || unscoredKey.length > 0,
  }
}
