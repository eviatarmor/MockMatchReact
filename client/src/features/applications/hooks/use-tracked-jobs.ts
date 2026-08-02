import { useCallback, useEffect, useMemo, useRef } from "react"
import { useLocalStorage } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc"
import type { DiscoverJob, TrackedJob, TrackingStatus } from "@/features/discover/types"
import {
  discoverJobToTracked,
  parseJobDescriptionToTracked,
} from "../lib/map-tracked-job"
import {
  mapApiTrackedJob,
  trackedJobToUpsertInput,
} from "../lib/map-api-tracked-job"
import type { EmailProvider } from "../types"

const STORAGE_KEY = "mm.trackedJobs"
/** Legacy boolean flag — migrated into EMAIL_PROVIDER_KEY. */
const GMAIL_KEY = "mm.gmailConnected"
const EMAIL_PROVIDER_KEY = "mm.emailProvider"
const GMAIL_LISTEN_KEY = "mm.gmailListenJobIds"
const LOCAL_IMPORT_DONE_KEY = "mm.trackedJobs.importDone"

const EMAIL_PROVIDERS: readonly EmailProvider[] = [
  "google",
  "microsoft",
  "apple",
  "yahoo",
]

function isEmailProvider(value: unknown): value is EmailProvider {
  return (
    typeof value === "string" &&
    (EMAIL_PROVIDERS as readonly string[]).includes(value)
  )
}

function readLocalJobs(): TrackedJob[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as TrackedJob[]
  } catch {
    return []
  }
}

function clearLocalJobs() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.setItem(LOCAL_IMPORT_DONE_KEY, "1")
}

/**
 * Cross-route tracked-job store (Discover toggle → Applications Saved).
 * Server-backed via tRPC; one-time localStorage import on first empty list.
 */
function notifyQuestionGen(
  status: string | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string
) {
  if (status === "started") {
    toast.message(
      t("applications.questionGen.started", {
        defaultValue: "Generating interview questions for this job…",
      }),
      {
        description: t("applications.questionGen.startedDescription", {
          defaultValue:
            "They will appear in Question Bank shortly. Duplicates are skipped.",
        }),
      }
    )
    return
  }
  if (status === "skipped_already") {
    // Silent — already generated for this job
    return
  }
  if (status === "skipped_no_key") {
    toast.message(
      t("applications.questionGen.noKey", {
        defaultValue: "Job saved. Question generation needs OPENROUTER_API_KEY.",
      })
    )
  }
}

export function useTrackedJobs() {
  const { t } = useTranslation("common")
  const utils = trpc.useUtils()
  const listQuery = trpc.trackedJobs.list.useQuery(undefined, {
    staleTime: 30_000,
  })
  const importDoneRef = useRef(false)

  const upsertMut = trpc.trackedJobs.upsert.useMutation({
    onSuccess: (result) => {
      void utils.trackedJobs.list.invalidate()
      notifyQuestionGen(result.questionGen, t)
      if (result.questionGen === "started") {
        // Refresh bank after models finish (best-effort)
        window.setTimeout(() => {
          void utils.questions.list.invalidate()
        }, 45_000)
      }
    },
  })
  const updateStatusMut = trpc.trackedJobs.updateStatus.useMutation({
    onSuccess: () => {
      void utils.trackedJobs.list.invalidate()
    },
  })
  const replaceStatusesMut = trpc.trackedJobs.replaceStatuses.useMutation({
    onSuccess: () => {
      void utils.trackedJobs.list.invalidate()
    },
  })
  const removeMut = trpc.trackedJobs.remove.useMutation({
    onSuccess: () => {
      void utils.trackedJobs.list.invalidate()
    },
  })
  const removeBySourceKeyMut = trpc.trackedJobs.removeBySourceKey.useMutation({
    onSuccess: () => {
      void utils.trackedJobs.list.invalidate()
    },
  })
  const importLocalMut = trpc.trackedJobs.importLocal.useMutation({
    onSuccess: () => {
      void utils.trackedJobs.list.invalidate()
    },
  })

  const jobs: TrackedJob[] = useMemo(
    () => (listQuery.data ?? []).map(mapApiTrackedJob),
    [listQuery.data]
  )

  // One-shot migrate localStorage → server when list is empty
  useEffect(() => {
    if (importDoneRef.current) return
    if (listQuery.isLoading || listQuery.isError) return
    if (typeof window === "undefined") return
    if (window.localStorage.getItem(LOCAL_IMPORT_DONE_KEY) === "1") {
      importDoneRef.current = true
      return
    }
    if ((listQuery.data?.length ?? 0) > 0) {
      clearLocalJobs()
      importDoneRef.current = true
      return
    }

    const local = readLocalJobs()
    if (local.length === 0) {
      clearLocalJobs()
      importDoneRef.current = true
      return
    }

    importDoneRef.current = true
    const payload = local.map((job) =>
      trackedJobToUpsertInput({
        sourceKey: job.sourceKey || job.id,
        provider: job.provider,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        applyUrl: job.applyUrl,
        status: job.status,
        salaryRange: job.salaryRange,
        seniority: job.seniority,
        matchScore: job.matchScore,
        matchTier: job.matchTier,
        avatarText: job.avatarText,
        avatarColorClass: job.avatarColorClass,
        postedAt: job.postedAt,
        nextStepDate: job.nextStepDate,
      })
    )

    importLocalMut.mutate(
      { jobs: payload },
      {
        onSettled: () => {
          clearLocalJobs()
        },
      }
    )
  }, [listQuery.isLoading, listQuery.isError, listQuery.data, importLocalMut])

  const isTracked = useCallback(
    (discoverOrSourceKey: string) =>
      jobs.some(
        (job) =>
          job.sourceKey === discoverOrSourceKey || job.id === discoverOrSourceKey
      ),
    [jobs]
  )

  const hasApplied = useCallback(
    (discoverOrSourceKey: string) => {
      const job = jobs.find(
        (item) =>
          item.sourceKey === discoverOrSourceKey || item.id === discoverOrSourceKey
      )
      return job != null && job.status !== "saved"
    },
    [jobs]
  )

  const trackDiscoverJob = useCallback(
    (job: DiscoverJob) => {
      if (isTracked(job.id)) return
      const tracked = discoverJobToTracked(job)
      upsertMut.mutate(
        trackedJobToUpsertInput({
          sourceKey: tracked.sourceKey,
          provider: tracked.provider,
          title: tracked.title,
          company: tracked.company,
          location: tracked.location,
          description: tracked.description,
          applyUrl: tracked.applyUrl,
          status: "saved",
          salaryRange: tracked.salaryRange,
          seniority: tracked.seniority,
          matchScore: tracked.matchScore,
          matchTier: tracked.matchTier,
          avatarText: tracked.avatarText,
          avatarColorClass: tracked.avatarColorClass,
          postedAt: tracked.postedAt,
          nextStepDate: tracked.nextStepDate,
        })
      )
    },
    [isTracked, upsertMut]
  )

  const untrack = useCallback(
    (idOrSourceKey: string) => {
      const byId = jobs.find((j) => j.id === idOrSourceKey)
      if (byId) {
        removeMut.mutate({ id: byId.id })
        return
      }
      removeBySourceKeyMut.mutate({ sourceKey: idOrSourceKey })
    },
    [jobs, removeMut, removeBySourceKeyMut]
  )

  const toggleDiscoverJob = useCallback(
    (job: DiscoverJob) => {
      if (isTracked(job.id)) {
        untrack(job.id)
        return false
      }
      trackDiscoverJob(job)
      return true
    },
    [isTracked, trackDiscoverJob, untrack]
  )

  const addFromPaste = useCallback(
    (description: string) => {
      const trackedJob = parseJobDescriptionToTracked(description)
      upsertMut.mutate(
        trackedJobToUpsertInput({
          sourceKey: trackedJob.sourceKey,
          provider: trackedJob.provider ?? "import",
          title: trackedJob.title,
          company: trackedJob.company,
          location: trackedJob.location,
          description: trackedJob.description,
          applyUrl: trackedJob.applyUrl,
          status: "saved",
          salaryRange: trackedJob.salaryRange,
          seniority: trackedJob.seniority,
          matchScore: trackedJob.matchScore,
          matchTier: trackedJob.matchTier,
          avatarText: trackedJob.avatarText,
          avatarColorClass: trackedJob.avatarColorClass,
          postedAt: trackedJob.postedAt,
          nextStepDate: trackedJob.nextStepDate,
          generateQuestions: true,
        })
      )
      return trackedJob
    },
    [upsertMut]
  )

  const updateStatus = useCallback(
    (id: string, status: TrackingStatus) => {
      const job = jobs.find((j) => j.id === id || j.sourceKey === id)
      if (!job) return
      updateStatusMut.mutate({ id: job.id, status })
    },
    [jobs, updateStatusMut]
  )

  const replaceStatuses = useCallback(
    (updates: ReadonlyArray<{ id: string; status: TrackingStatus }>) => {
      const mapped = updates
        .map((u) => {
          const job = jobs.find((j) => j.id === u.id || j.sourceKey === u.id)
          if (!job) return null
          return { id: job.id, status: u.status }
        })
        .filter((u): u is { id: string; status: TrackingStatus } => u != null)
      if (mapped.length === 0) return
      replaceStatusesMut.mutate({ updates: mapped })
    },
    [jobs, replaceStatusesMut]
  )

  const markAppliedFromDiscover = useCallback(
    (job: DiscoverJob) => {
      const existing = jobs.find((item) => item.sourceKey === job.id)
      if (existing && existing.status !== "saved") return false

      const tracked = discoverJobToTracked(job)
      upsertMut.mutate(
        trackedJobToUpsertInput({
          sourceKey: tracked.sourceKey,
          provider: tracked.provider,
          title: tracked.title,
          company: tracked.company,
          location: tracked.location,
          description: tracked.description,
          applyUrl: tracked.applyUrl,
          status: "applied",
          salaryRange: tracked.salaryRange,
          seniority: tracked.seniority,
          matchScore: tracked.matchScore,
          matchTier: tracked.matchTier,
          avatarText: tracked.avatarText,
          avatarColorClass: tracked.avatarColorClass,
          postedAt: tracked.postedAt,
          nextStepDate: tracked.nextStepDate,
          generateQuestions: true,
        })
      )
      return true
    },
    [jobs, upsertMut]
  )

  return {
    jobs,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
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
  const [listenJobIds, setListenJobIds] = useLocalStorage<string[]>(
    GMAIL_LISTEN_KEY,
    []
  )

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
        return list.includes(jobId)
          ? list.filter((id) => id !== jobId)
          : [...list, jobId]
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

