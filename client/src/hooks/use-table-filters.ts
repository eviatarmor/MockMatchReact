import { useCallback, useMemo, useState } from "react"
import {
  clearAllTableFilters,
  clearTableFilterField,
  countActiveTableFilters,
  emptyTableFilters,
  filterByTableFilters,
  hasActiveTableFilters,
  toggleTableFilterValue,
  type TableFilterValues,
} from "@/lib/table-filters"

export function useTableFilters() {
  const [filters, setFilters] = useState<TableFilterValues>(emptyTableFilters)

  const toggleValue = useCallback((fieldId: string, value: string) => {
    setFilters((prev) => toggleTableFilterValue(prev, fieldId, value))
  }, [])

  const clearField = useCallback((fieldId: string) => {
    setFilters((prev) => clearTableFilterField(prev, fieldId))
  }, [])

  const clearAll = useCallback(() => {
    setFilters(clearAllTableFilters())
  }, [])

  const isValueSelected = useCallback(
    (fieldId: string, value: string) =>
      Boolean(filters.get(fieldId)?.has(value)),
    [filters]
  )

  const hasActive = useMemo(() => hasActiveTableFilters(filters), [filters])
  const activeCount = useMemo(() => countActiveTableFilters(filters), [filters])

  const filterItems = useCallback(
    <T,>(
      items: readonly T[],
      getFieldValue: (item: T, fieldId: string) => string | null | undefined
    ) => filterByTableFilters(items, filters, getFieldValue),
    [filters]
  )

  return {
    filters,
    toggleValue,
    clearField,
    clearAll,
    isValueSelected,
    hasActive,
    activeCount,
    filterItems,
  }
}
