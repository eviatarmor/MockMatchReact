import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import type { DiscoverJob, TrackedJob, TrackingStatus } from "@/features/discover/types"
import {
  discoverJobToTracked,
  parseJobDescriptionToTracked,
} from "../lib/map-tracked-job"

const STORAGE_KEY = "mm.trackedJobs"
const GMAIL_KEY = "mm.gmailConnected"
const GMAIL_LISTEN_KEY = "mm.gmailListenJobIds"

type Listener = () => void

let jobsCache: TrackedJob[] | null = null
const listeners = new Set<Listener>()

function loadJobs(): TrackedJob[] {
  if (jobsCache) return jobsCache
  if (typeof window === "undefined") {
    jobsCache = []
    return jobsCache
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    jobsCache = raw ? (JSON.parse(raw) as TrackedJob[]) : []
  } catch {
    jobsCache = []
  }
  return jobsCache
}

function persist(next: TrackedJob[]) {
  jobsCache = next
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return loadJobs()
}

function getServerSnapshot(): TrackedJob[] {
  return []
}

function readJsonArray(key: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeJsonArray(key: string, value: string[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

/**
 * Cross-route tracked-job store (Discover toggle → Applications Saved).
 * localStorage-backed until a tracking API lands.
 */
export function useTrackedJobs() {
  const jobs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Multi-tab sync
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      jobsCache = null
      for (const listener of listeners) listener()
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const isTracked = useCallback(
    (id: string) => jobs.some((job) => job.id === id),
    [jobs]
  )

  const trackDiscoverJob = useCallback((job: DiscoverJob) => {
    const current = loadJobs()
    if (current.some((tracked) => tracked.id === job.id)) return
    persist([discoverJobToTracked(job), ...current])
  }, [])

  const untrack = useCallback((id: string) => {
    persist(loadJobs().filter((job) => job.id !== id))
  }, [])

  const toggleDiscoverJob = useCallback((job: DiscoverJob) => {
    const current = loadJobs()
    if (current.some((tracked) => tracked.id === job.id)) {
      persist(current.filter((tracked) => tracked.id !== job.id))
      return false
    }
    persist([discoverJobToTracked(job), ...current])
    return true
  }, [])

  const addFromPaste = useCallback((description: string) => {
    const tracked = parseJobDescriptionToTracked(description)
    const current = loadJobs()
    persist([tracked, ...current])
    return tracked
  }, [])

  const updateStatus = useCallback((id: string, status: TrackingStatus) => {
    const current = loadJobs()
    const next = current.map((job) => {
      if (job.id !== id || job.status === status) return job
      const progressCompleted =
        status === "saved"
          ? 0
          : status === "applied"
            ? 1
            : status === "interviewing"
              ? 2
              : 3
      const activeStepIndex =
        status === "saved" ? null : Math.min(progressCompleted, 3)
      return {
        ...job,
        status,
        progressCompleted,
        activeStepIndex,
        statusUpdatedAt:
          status === "saved"
            ? "Saved just now"
            : status === "applied"
              ? "Applied just now"
              : status === "interviewing"
                ? "Interviewing"
                : "Offer",
        nextStep:
          status === "saved"
            ? "Tailor resume & apply"
            : status === "applied"
              ? "Follow up with recruiter"
              : status === "interviewing"
                ? "Prep for next round"
                : "Review offer details",
      }
    })
    persist(next)
  }, [])

  const replaceStatuses = useCallback(
    (updates: ReadonlyArray<{ id: string; status: TrackingStatus }>) => {
      const byId = new Map(updates.map((u) => [u.id, u.status]))
      const current = loadJobs()
      let changed = false
      const next = current.map((job) => {
        const status = byId.get(job.id)
        if (!status || status === job.status) return job
        changed = true
        const progressCompleted =
          status === "saved"
            ? 0
            : status === "applied"
              ? 1
              : status === "interviewing"
                ? 2
                : 3
        return {
          ...job,
          status,
          progressCompleted,
          activeStepIndex: status === "saved" ? null : Math.min(progressCompleted, 3),
        }
      })
      if (changed) persist(next)
    },
    []
  )

  return {
    jobs,
    isTracked,
    trackDiscoverJob,
    untrack,
    toggleDiscoverJob,
    addFromPaste,
    updateStatus,
    replaceStatuses,
  }
}

/** Gmail connection + per-position listen prefs (client stub until OAuth lands). */
export function useGmailListen() {
  const [connected, setConnected] = useState(() => {
    if (typeof window === "undefined") return false
    return window.localStorage.getItem(GMAIL_KEY) === "true"
  })
  const [listenJobIds, setListenJobIds] = useState<string[]>(() =>
    readJsonArray(GMAIL_LISTEN_KEY)
  )

  const connect = useCallback(() => {
    window.localStorage.setItem(GMAIL_KEY, "true")
    setConnected(true)
  }, [])

  const disconnect = useCallback(() => {
    window.localStorage.setItem(GMAIL_KEY, "false")
    setConnected(false)
  }, [])

  const setListening = useCallback((jobIds: string[]) => {
    writeJsonArray(GMAIL_LISTEN_KEY, jobIds)
    setListenJobIds(jobIds)
  }, [])

  const toggleListen = useCallback((jobId: string) => {
    setListenJobIds((prev) => {
      const next = prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
      writeJsonArray(GMAIL_LISTEN_KEY, next)
      return next
    })
  }, [])

  return {
    connected,
    listenJobIds,
    connect,
    disconnect,
    setListening,
    toggleListen,
  }
}
