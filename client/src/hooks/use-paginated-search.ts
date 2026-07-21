import { useEffect, useState } from "react"

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_DEBOUNCE_MS = 300

interface UsePaginatedSearchOptions {
  readonly pageSize?: number
  readonly debounceMs?: number
}

/**
 * Shared search + page state for server-paginated entity lists.
 * Callers pass debounced search + page into their tRPC query.
 */
export function usePaginatedSearch(options: UsePaginatedSearchOptions = {}) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, debounceMs)
    return () => window.clearTimeout(timer)
  }, [search, debounceMs])

  return {
    search,
    setSearch,
    debouncedSearch,
    page,
    setPage,
    pageSize,
  }
}

/** Keep page in range after deletes empty the last page. */
export function usePageClamp(
  page: number,
  setPage: (page: number) => void,
  total: number,
  pageSize: number,
  isBusy: boolean
) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    if (isBusy) return
    if (page > totalPages) setPage(totalPages)
  }, [isBusy, page, totalPages, setPage])

  return totalPages
}
