import { useCallback } from "react"
import { useLocalStorage } from "@uidotdev/usehooks"
import type { DiscoverJob, TrackedJob, TrackingStatus } from "@/features/discover/types"
import {
  discoverJobToTracked,
  parseJobDescriptionToTracked,
} from "../lib/map-tracked-job"

import type { EmailProvider } from "../types"

const STORAGE_KEY = "mm.trackedJobs"
/** Legacy boolean flag — migrated into EMAIL_PROVIDER_KEY. */
const GMAIL_KEY = "mm.gmailConnected"
const EMAIL_PROVIDER_KEY = "mm.emailProvider"
const GMAIL_LISTEN_KEY = "mm.gmailListenJobIds"

const EMAIL_PROVIDERS: readonly EmailProvider[] = [
  "google",
  "microsoft",
  "apple",
  "yahoo",
]

function isEmailProvider(value: unknown): value is EmailProvider {
  return typeof value === "string" && (EMAIL_PROVIDERS as readonly string[]).includes(value)
}

function statusFields(status: TrackingStatus): Pick<
  TrackedJob,
  "status" | "progressCompleted" | "activeStepIndex" | "statusUpdatedAt" | "nextStep"
> {
  const progressCompleted =
    status === "saved" ? 0 : status === "applied" ? 1 : status === "interviewing" ? 2 : 3

  return {
    status,
    progressCompleted,
    activeStepIndex: status === "saved" ? null : Math.min(progressCompleted, 3),
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
}

/**
 * Cross-route tracked-job store (Discover toggle → Applications Saved).
 * localStorage-backed until a tracking API lands.
 */
export function useTrackedJobs() {
  const [jobs, setJobs] = useLocalStorage<TrackedJob[]>(STORAGE_KEY, [])
  const list = jobs ?? []

  const isTracked = useCallback((id: string) => list.some((job) => job.id === id), [list])

  /** Applied / interviewing / offer — past Saved (or never tracked → false). */
  const hasApplied = useCallback(
    (id: string) => {
      const job = list.find((item) => item.id === id)
      return job != null && job.status !== "saved"
    },
    [list]
  )

  const trackDiscoverJob = useCallback(
    (job: DiscoverJob) => {
      setJobs((current) => {
        const prev = current ?? []
        if (prev.some((tracked) => tracked.id === job.id)) return prev
        return [discoverJobToTracked(job), ...prev]
      })
    },
    [setJobs]
  )

  const untrack = useCallback(
    (id: string) => {
      setJobs((current) => (current ?? []).filter((job) => job.id !== id))
    },
    [setJobs]
  )

  const toggleDiscoverJob = useCallback(
    (job: DiscoverJob) => {
      let tracked = false
      setJobs((current) => {
        const prev = current ?? []
        if (prev.some((item) => item.id === job.id)) {
          tracked = false
          return prev.filter((item) => item.id !== job.id)
        }
        tracked = true
        return [discoverJobToTracked(job), ...prev]
      })
      return tracked
    },
    [setJobs]
  )

  const addFromPaste = useCallback(
    (description: string) => {
      const trackedJob = parseJobDescriptionToTracked(description)
      setJobs((current) => [trackedJob, ...(current ?? [])])
      return trackedJob
    },
    [setJobs]
  )

  const updateStatus = useCallback(
    (id: string, status: TrackingStatus) => {
      setJobs((current) =>
        (current ?? []).map((job) => {
          if (job.id !== id || job.status === status) return job
          return { ...job, ...statusFields(status) }
        })
      )
    },
    [setJobs]
  )

  const replaceStatuses = useCallback(
    (updates: ReadonlyArray<{ id: string; status: TrackingStatus }>) => {
      const byId = new Map(updates.map((u) => [u.id, u.status]))
      setJobs((current) => {
        const prev = current ?? []
        let changed = false
        const next = prev.map((job) => {
          const status = byId.get(job.id)
          if (!status || status === job.status) return job
          changed = true
          return { ...job, ...statusFields(status) }
        })
        return changed ? next : prev
      })
    },
    [setJobs]
  )

  /**
   * Discover “I applied” — upsert job and move to Applied (or leave later stages alone).
   * Returns true when status was newly set/advanced to applied.
   */
  const markAppliedFromDiscover = useCallback(
    (job: DiscoverJob) => {
      const existing = list.find((item) => item.id === job.id)
      if (existing && existing.status !== "saved") return false

      setJobs((current) => {
        const prev = current ?? []
        const row = prev.find((item) => item.id === job.id)
        if (row) {
          if (row.status !== "saved") return prev
          return prev.map((item) =>
            item.id === job.id ? { ...item, ...statusFields("applied") } : item
          )
        }
        return [
          { ...discoverJobToTracked(job), ...statusFields("applied") },
          ...prev,
        ]
      })
      return true
    },
    [list, setJobs]
  )

  return {
    jobs: list,
    isTracked,
    hasApplied,
    trackDiscoverJob,
    untrack,
    toggleDiscoverJob,
    addFromPaste,
    updateStatus,
    replaceStatuses,
    markAppliedFromDiscover,
  }
}

/**
 * Migrate legacy gmail boolean → email provider id.
 * Older builds stored plain `"true"`/`"false"` or JSON boolean under GMAIL_KEY.
 */
function migrateEmailProviderFlag() {
  if (typeof window === "undefined") return
  if (window.localStorage.getItem(EMAIL_PROVIDER_KEY) != null) return

  const raw = window.localStorage.getItem(GMAIL_KEY)
  if (raw == null) return

  let wasConnected = false
  if (raw === "true" || raw === "false") {
    wasConnected = raw === "true"
  } else {
    try {
      wasConnected = JSON.parse(raw) === true
    } catch {
      wasConnected = false
    }
  }

  if (wasConnected) {
    window.localStorage.setItem(EMAIL_PROVIDER_KEY, JSON.stringify("google"))
  }
  window.localStorage.removeItem(GMAIL_KEY)
}

/**
 * Inbox provider connection + per-position listen prefs (client stub until OAuth lands).
 * @deprecated Prefer `useEmailConnect` — kept as alias for existing imports.
 */
export function useGmailListen() {
  return useEmailConnect()
}

/** Inbox provider connection + per-position listen prefs (client stub until OAuth lands). */
export function useEmailConnect() {
  migrateEmailProviderFlag()

  const [provider, setProvider] = useLocalStorage<EmailProvider | null>(
    EMAIL_PROVIDER_KEY,
    null
  )
  const [listenJobIds, setListenJobIds] = useLocalStorage<string[]>(GMAIL_LISTEN_KEY, [])

  const connectedProvider = isEmailProvider(provider) ? provider : null
  const connected = connectedProvider != null

  const connect = useCallback(
    (next: EmailProvider) => setProvider(next),
    [setProvider]
  )
  const disconnect = useCallback(() => setProvider(null), [setProvider])

  const setListening = useCallback(
    (jobIds: string[]) => setListenJobIds(jobIds),
    [setListenJobIds]
  )

  const toggleListen = useCallback(
    (jobId: string) => {
      setListenJobIds((prev) => {
        const list = prev ?? []
        return list.includes(jobId) ? list.filter((id) => id !== jobId) : [...list, jobId]
      })
    },
    [setListenJobIds]
  )

  return {
    connected,
    connectedProvider,
    listenJobIds: listenJobIds ?? [],
    connect,
    disconnect,
    setListening,
    toggleListen,
  }
}
