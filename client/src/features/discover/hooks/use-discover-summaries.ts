import { useEffect, useMemo, useRef, useState } from "react"
import { trpc } from "@/lib/trpc"
import { heuristicJobSummary } from "../lib/map-job"
import type { DiscoverJob } from "../types"

const BATCH_DEBOUNCE_MS = 350
/** Never hammer the API for the same job after a failure. */
const MAX_ATTEMPTS = 1

/**
 * Upgrade Discover card blurbs via free OpenRouter model.
 * Cards already have a heuristic `summary` from map-job; this replaces with AI when ready.
 */
export function useDiscoverSummaries(jobs: readonly DiscoverJob[]) {
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  /** Forces pendingKey recompute when inFlight / attempts change (refs alone don't). */
  const [flightTick, setFlightTick] = useState(0)
  const inFlightRef = useRef<Set<string>>(new Set())
  const attemptsRef = useRef<Map<string, number>>(new Map())

  const summarize = trpc.jobs.summarize.useMutation({
    onSuccess: (data, variables) => {
      setSummaries((prev) => {
        const next = { ...prev, ...data.summaries }
        for (const job of variables.jobs) {
          if (!next[job.id]) {
            next[job.id] = heuristicJobSummary(job)
          }
        }
        return next
      })
      for (const job of variables.jobs) {
        inFlightRef.current.delete(job.id)
      }
      setFlightTick((n) => n + 1)
    },
    onError: (_err, variables) => {
      // Stop retry loops — fill heuristic and clear in-flight
      setSummaries((prev) => {
        const next = { ...prev }
        for (const job of variables.jobs) {
          if (!next[job.id]) {
            next[job.id] = heuristicJobSummary(job)
          }
        }
        return next
      })
      for (const job of variables.jobs) {
        inFlightRef.current.delete(job.id)
      }
      setFlightTick((n) => n + 1)
    },
  })

  const pendingKey = useMemo(() => {
    return jobs
      .filter((j) => {
        if (!j.description.trim()) return false
        if (summaries[j.id]) return false
        if (inFlightRef.current.has(j.id)) return false
        const attempts = attemptsRef.current.get(j.id) ?? 0
        if (attempts >= MAX_ATTEMPTS) return false
        return true
      })
      .map((j) => j.id)
      .join("|")
  }, [jobs, summaries, flightTick])

  useEffect(() => {
    if (!pendingKey) return

    const timer = window.setTimeout(() => {
      const pending = jobs.filter((j) => {
        if (!j.description.trim()) return false
        if (summaries[j.id]) return false
        if (inFlightRef.current.has(j.id)) return false
        const attempts = attemptsRef.current.get(j.id) ?? 0
        return attempts < MAX_ATTEMPTS
      })
      if (pending.length === 0) return

      const batch = pending.slice(0, 15)
      for (const j of batch) {
        inFlightRef.current.add(j.id)
        attemptsRef.current.set(j.id, (attemptsRef.current.get(j.id) ?? 0) + 1)
      }
      setFlightTick((n) => n + 1)

      summarize.mutate({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey, jobs])

  const jobIdsSignature = useMemo(
    () => jobs.map((j) => j.id).join(","),
    [jobs]
  )
  const prevSig = useRef(jobIdsSignature)
  useEffect(() => {
    if (prevSig.current === jobIdsSignature) return
    prevSig.current = jobIdsSignature
    setSummaries((prev) => {
      const next: Record<string, string> = {}
      const idSet = new Set(jobs.map((j) => j.id))
      for (const [id, text] of Object.entries(prev)) {
        if (idSet.has(id)) next[id] = text
      }
      return next
    })
    for (const id of [...attemptsRef.current.keys()]) {
      if (!jobs.some((j) => j.id === id)) attemptsRef.current.delete(id)
    }
  }, [jobIdsSignature, jobs])

  return {
    summaries,
    /** Only true while a network request is in flight — never stuck on pendingKey alone. */
    isSummarizing: summarize.isPending,
  }
}
