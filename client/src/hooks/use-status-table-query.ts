import { useMemo } from "react"
import { statusFieldValue } from "@/lib/status-table-filter"
import {
  filterByTableFilters,
  hasActiveTableFilters,
  type TableFilterValues,
} from "@/lib/table-filters"

/**
 * Shared status-filter application for entity list pages.
 * Keeps filtered rows + active-query flag consistent across tables.
 */
export function useStatusTableQuery<T extends { readonly status: string }>(
  items: readonly T[],
  filters: TableFilterValues,
  hasActiveSearch: boolean
) {
  const filteredItems = useMemo(
    () => filterByTableFilters(items, filters, statusFieldValue),
    [items, filters]
  )
  const hasActiveQuery = hasActiveSearch || hasActiveTableFilters(filters)
  return { filteredItems, hasActiveQuery }
}
