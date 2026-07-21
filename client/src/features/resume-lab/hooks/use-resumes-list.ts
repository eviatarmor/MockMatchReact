import { trpc } from "@/lib/trpc"
import { usePageClamp, usePaginatedSearch } from "@/hooks/use-paginated-search"
import { toResumeItem } from "../utils"
import type { ResumeItem } from "../types"

export function useResumesList() {
  const pagination = usePaginatedSearch()

  const query = trpc.resumes.list.useQuery({
    page: pagination.page,
    pageSize: pagination.pageSize,
    search: pagination.debouncedSearch || undefined,
  })

  const items: ResumeItem[] = (query.data?.items ?? []).map(toResumeItem)
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
