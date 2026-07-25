import { trpc } from "@/lib/trpc"
import { usePageClamp, usePaginatedSearch } from "@/hooks/use-paginated-search"
import { toCoverLetterItem } from "../utils"
import { useEnsureGeneralScores } from "./use-ensure-general-scores"
import type { CoverLetterItem } from "../types"

export function useCoverLettersList() {
  const pagination = usePaginatedSearch()

  const query = trpc.coverLetters.list.useQuery({
    page: pagination.page,
    pageSize: pagination.pageSize,
    search: pagination.debouncedSearch || undefined,
  })

  const items: CoverLetterItem[] = (query.data?.items ?? []).map(toCoverLetterItem)
  // Null scores (created before scoring) → compute with editor pipeline + persist.
  useEnsureGeneralScores(items)
  const total = query.data?.total ?? 0
  const totalPages = usePageClamp(
    pagination.page,
    pagination.setPage,
    total,
    pagination.pageSize,
    query.isFetching || query.isLoading
  )

  return {
    search: pagination.search,
    setSearch: pagination.setSearch,
    page: pagination.page,
    setPage: pagination.setPage,
    pageSize: pagination.pageSize,
    total,
    totalPages,
    items,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    isEmpty: !query.isLoading && items.length === 0,
    hasActiveSearch: Boolean(pagination.debouncedSearch),
    refetch: query.refetch,
  }
}
