import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { usePageClamp, usePaginatedSearch } from "@/hooks/use-paginated-search"
import { trpc } from "@/lib/trpc"
import { INTERVIEW_TRACKS } from "../constants"
import type { RecentSession, SessionStatus } from "../types"

function trackTitle(
  trackId: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const track = INTERVIEW_TRACKS.find((item) => item.id === trackId)
  if (track) {
    return t(track.titleKey)
  }
  return trackId
}

function formatLabel(
  kind: "voice" | "ide",
  trackId: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
  opts?: { boardId?: string | null; workspaceId?: string | null }
): string {
  if (kind === "voice") {
    return t("simulations.format.conversation")
  }
  const track = INTERVIEW_TRACKS.find((item) => item.id === trackId)
  if (track) {
    return t(`simulations.format.${track.format}`)
  }
  if (trackId === "shell") return t("simulations.format.terminal")
  if (trackId === "workspace" || trackId === "react") {
    return t("simulations.format.workspace")
  }
  // Bank q: rows — infer surface from linked document when catalog miss.
  if (trackId.startsWith("q:")) {
    if (opts?.boardId) return t("simulations.format.whiteboard")
    if (opts?.workspaceId) return t("simulations.format.codeRun")
  }
  return t("simulations.format.codeRun")
}

/**
 * Merged history: voice sessions + IDE practice attempts.
 * Retakes appear as separate rows.
 */
export function useSessionsList() {
  const { t } = useTranslation("common")
  const pagination = usePaginatedSearch()
  const utils = trpc.useUtils()

  // Fetch a larger page server-side then merge/sort client-side for unified list.
  // Good enough for v1; true DB union can come later.
  const fetchSize = 50

  const voiceQuery = trpc.voice.listSessions.useQuery({
    page: 1,
    pageSize: fetchSize,
    search: pagination.debouncedSearch || undefined,
  })

  const ideQuery = trpc.practiceSessions.list.useQuery({
    page: 1,
    pageSize: fetchSize,
    search: pagination.debouncedSearch || undefined,
  })

  const deleteVoice = trpc.voice.deleteSession.useMutation({
    onSuccess: () => {
      void utils.voice.listSessions.invalidate()
    },
  })

  const deleteIde = trpc.practiceSessions.delete.useMutation({
    onSuccess: () => {
      void utils.practiceSessions.list.invalidate()
    },
  })

  type MergedRow = RecentSession & {
    _source: "voice" | "ide"
    _sourceId: string
    _workspaceId?: string | null
  }

  const allItems: MergedRow[] = useMemo(() => {
    const voiceRows: MergedRow[] = (voiceQuery.data?.items ?? []).map(
      (row) => ({
        id: `voice:${row.id}`,
        _sourceId: row.id,
        _source: "voice",
        title: trackTitle(row.trackId, t),
        track: formatLabel("voice", row.trackId, t),
        trackId: row.trackId,
        updatedAt: row.updatedAt,
        durationMin: row.durationMin,
        score: row.score,
        status: row.status as SessionStatus,
      })
    )

    const ideRows: MergedRow[] = (ideQuery.data?.items ?? []).map((row) => {
      const durationMin =
        row.endedAt && row.startedAt
          ? Math.max(
              1,
              Math.round(
                (new Date(row.endedAt).getTime() -
                  new Date(row.startedAt).getTime()) /
                  60_000
              )
            )
          : 0
      return {
        id: `ide:${row.id}`,
        _sourceId: row.id,
        _source: "ide",
        title: row.title || trackTitle(row.trackId, t),
        track: formatLabel("ide", row.trackId, t, {
          boardId: row.boardId,
          workspaceId: row.workspaceId,
        }),
        trackId: row.trackId,
        workspaceId: row.workspaceId,
        boardId: row.boardId,
        _workspaceId: row.workspaceId,
        updatedAt: row.updatedAt,
        durationMin,
        score: row.score,
        status: row.status as SessionStatus,
      }
    })

    return [...voiceRows, ...ideRows].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [voiceQuery.data?.items, ideQuery.data?.items, t])

  const total = allItems.length
  const totalPages = usePageClamp(
    pagination.page,
    pagination.setPage,
    total,
    pagination.pageSize,
    voiceQuery.isFetching || ideQuery.isFetching
  )

  const items = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return allItems.slice(start, start + pagination.pageSize)
  }, [allItems, pagination.page, pagination.pageSize])

  const removeSession = useCallback(
    (session: RecentSession & { _source?: string; _sourceId?: string }) => {
      const source = session._source
      const sourceId = session._sourceId
      if (source === "ide" && sourceId) {
        deleteIde.mutate({ sessionId: sourceId })
        return
      }
      if (source === "voice" && sourceId) {
        deleteVoice.mutate({ sessionId: sourceId })
        return
      }
      // Fallback parse composite id
      if (session.id.startsWith("ide:")) {
        deleteIde.mutate({ sessionId: session.id.slice(4) })
      } else if (session.id.startsWith("voice:")) {
        deleteVoice.mutate({ sessionId: session.id.slice(6) })
      }
    },
    [deleteIde, deleteVoice]
  )

  const isLoading = voiceQuery.isLoading || ideQuery.isLoading
  const isFetching = voiceQuery.isFetching || ideQuery.isFetching
  const isError = voiceQuery.isError || ideQuery.isError

  return {
    search: pagination.search,
    setSearch: pagination.setSearch,
    page: pagination.page,
    setPage: pagination.setPage,
    pageSize: pagination.pageSize,
    total,
    totalPages,
    items,
    isLoading,
    isFetching,
    isError,
    isEmpty: !isLoading && items.length === 0,
    hasActiveSearch: Boolean(pagination.debouncedSearch),
    removeSession,
    deletingId:
      deleteVoice.isPending
        ? `voice:${deleteVoice.variables?.sessionId}`
        : deleteIde.isPending
          ? `ide:${deleteIde.variables?.sessionId}`
          : null,
  }
}
