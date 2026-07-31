import { useCallback, useMemo, useState } from "react"
import { usePageClamp, usePaginatedSearch } from "@/hooks/use-paginated-search"
import { MOCK_RECENT_SESSIONS } from "../constants"
import type { RecentSession } from "../types"

function matchesSearch(session: RecentSession, needle: string) {
  if (!needle) return true
  const q = needle.toLowerCase()
  return (
    session.title.toLowerCase().includes(q) ||
    session.track.toLowerCase().includes(q) ||
    session.status.toLowerCase().includes(q)
  )
}

/** Client-side mock list until sessions API lands. */
export function useSessionsList() {
  const pagination = usePaginatedSearch()
  const [sessions, setSessions] = useState<RecentSession[]>(() => [
    ...MOCK_RECENT_SESSIONS,
  ])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(
    () => sessions.filter((s) => matchesSearch(s, pagination.debouncedSearch)),
    [sessions, pagination.debouncedSearch]
  )

  const total = filtered.length
  const totalPages = usePageClamp(
    pagination.page,
    pagination.setPage,
    total,
    pagination.pageSize,
    false
  )

  const items = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return filtered.slice(start, start + pagination.pageSize)
  }, [filtered, pagination.page, pagination.pageSize])

  const removeSession = useCallback((session: RecentSession) => {
    setDeletingId(session.id)
    // Mock delete — local only until sessions API
    window.setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== session.id))
      setDeletingId(null)
    }, 200)
  }, [])

  return {
    search: pagination.search,
    setSearch: pagination.setSearch,
    page: pagination.page,
    setPage: pagination.setPage,
    pageSize: pagination.pageSize,
    total,
    totalPages,
    items,
    isLoading: false,
    isFetching: false,
    isError: false,
    isEmpty: items.length === 0,
    hasActiveSearch: Boolean(pagination.debouncedSearch),
    removeSession,
    deletingId,
  }
}
