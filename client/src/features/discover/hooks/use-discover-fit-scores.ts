import { useEffect, useMemo, useRef, useState } from "react"
import type { FitScore } from "@mockmatch/schemas"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { trpc } from "@/lib/trpc"
import type { DiscoverJob } from "../types"

const BATCH_DEBOUNCE_MS = 300
/** Never hammer the API for the same job after a failure / empty result. */
const MAX_ATTEMPTS = 1

/**
 * Batch-score visible jobs via multi-resume profile.
 * Free → heuristic. Paid credits → AI when available.
 *
 * Important: when the user has no resumes, the API returns mode "none" with
 * empty scores. We must mark those job ids as done so we do not re-request
 * forever and leave score skeletons spinning.
 */
export function useDiscoverFitScores(jobs: readonly DiscoverJob[]) {
  const { t } = useTranslation("common")
  const [scores, setScores] = useState<Record<string, FitScore>>({})
  const [mode, setMode] = useState<"heuristic" | "ai" | "none" | null>(null)
  const [creditsRemaining, setCreditsRemaining] = useState(0)
  /** Forces pendingKey recompute when inFlight / attempts change (refs alone don't). */
  const [flightTick, setFlightTick] = useState(0)
  const toastedRef = useRef(false)
  const inFlightRef = useRef<Set<string>>(new Set())
  const attemptsRef = useRef<Map<string, number>>(new Map())
  /** Jobs that finished without a score (no resume / error) — never re-queue. */
  const doneEmptyRef = useRef<Set<string>>(new Set())

  const scoreFits = trpc.jobs.scoreFits.useMutation({
    onSuccess: (data, variables) => {
      setMode(data.mode)
      setCreditsRemaining(data.creditsRemaining)
      setScores((prev) => ({ ...prev, ...data.scores }))

      for (const job of variables.jobs) {
        inFlightRef.current.delete(job.id)
        // mode "none" or job missing from scores → stop retrying forever
        if (!data.scores[job.id]) {
          doneEmptyRef.current.add(job.id)
        }
      }
      setFlightTick((n) => n + 1)

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
        doneEmptyRef.current.add(job.id)
      }
      setFlightTick((n) => n + 1)
    },
  })

  const pendingKey = useMemo(() => {
    return jobs
      .filter((j) => {
        if (scores[j.id]) return false
        if (doneEmptyRef.current.has(j.id)) return false
        if (inFlightRef.current.has(j.id)) return false
        const attempts = attemptsRef.current.get(j.id) ?? 0
        if (attempts >= MAX_ATTEMPTS) return false
        return true
      })
      .map((j) => j.id)
      .join("|")
  }, [jobs, scores, flightTick])

  useEffect(() => {
    if (!pendingKey) return

    const timer = window.setTimeout(() => {
      const pending = jobs.filter((j) => {
        if (scores[j.id]) return false
        if (doneEmptyRef.current.has(j.id)) return false
        if (inFlightRef.current.has(j.id)) return false
        const attempts = attemptsRef.current.get(j.id) ?? 0
        return attempts < MAX_ATTEMPTS
      })
      if (pending.length === 0) return

      const batch = pending.slice(0, 20)
      for (const j of batch) {
        inFlightRef.current.add(j.id)
        attemptsRef.current.set(j.id, (attemptsRef.current.get(j.id) ?? 0) + 1)
      }
      setFlightTick((n) => n + 1)

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
    // scores intentionally omitted from deps — use pendingKey + jobs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey, jobs])

  // Drop scores / bookkeeping for jobs no longer in the list
  const jobIdsSignature = useMemo(
    () => jobs.map((j) => j.id).join(","),
    [jobs]
  )
  const prevSig = useRef(jobIdsSignature)
  useEffect(() => {
    if (prevSig.current === jobIdsSignature) return
    prevSig.current = jobIdsSignature
    const idSet = new Set(jobs.map((j) => j.id))
    setScores((prev) => {
      const next: Record<string, FitScore> = {}
      for (const [id, score] of Object.entries(prev)) {
        if (idSet.has(id)) next[id] = score
      }
      return next
    })
    for (const id of [...attemptsRef.current.keys()]) {
      if (!idSet.has(id)) attemptsRef.current.delete(id)
    }
    for (const id of [...doneEmptyRef.current]) {
      if (!idSet.has(id)) doneEmptyRef.current.delete(id)
    }
    for (const id of [...inFlightRef.current]) {
      if (!idSet.has(id)) inFlightRef.current.delete(id)
    }
  }, [jobIdsSignature, jobs])

  return {
    scores,
    mode,
    creditsRemaining,
    /** Only true while a network request is in flight — never stuck on pendingKey alone. */
    isScoring: scoreFits.isPending,
  }
}
