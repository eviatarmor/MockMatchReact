/**
 * Multi-field table filters (Linear-style).
 * Empty field set = no constraint on that field.
 */

export type TableFilterValues = ReadonlyMap<string, ReadonlySet<string>>

export function emptyTableFilters(): TableFilterValues {
  return new Map()
}

export function hasActiveTableFilters(filters: TableFilterValues): boolean {
  for (const values of filters.values()) {
    if (values.size > 0) return true
  }
  return false
}

export function countActiveTableFilters(filters: TableFilterValues): number {
  let count = 0
  for (const values of filters.values()) {
    count += values.size
  }
  return count
}

export function toggleTableFilterValue(
  filters: TableFilterValues,
  fieldId: string,
  value: string
): TableFilterValues {
  const next = new Map(filters)
  const current = new Set(next.get(fieldId) ?? [])
  if (current.has(value)) {
    current.delete(value)
  } else {
    current.add(value)
  }
  if (current.size === 0) {
    next.delete(fieldId)
  } else {
    next.set(fieldId, current)
  }
  return next
}

export function clearTableFilterField(
  filters: TableFilterValues,
  fieldId: string
): TableFilterValues {
  if (!filters.has(fieldId)) return filters
  const next = new Map(filters)
  next.delete(fieldId)
  return next
}

export function clearAllTableFilters(): TableFilterValues {
  return emptyTableFilters()
}

/**
 * Item matches when every active field includes the item's value for that field.
 * Missing/undefined item values fail an active field constraint.
 */
export function matchesTableFilters(
  filters: TableFilterValues,
  getFieldValue: (fieldId: string) => string | null | undefined
): boolean {
  if (!hasActiveTableFilters(filters)) return true
  for (const [fieldId, values] of filters) {
    if (values.size === 0) continue
    const itemValue = getFieldValue(fieldId)
    if (itemValue == null || !values.has(itemValue)) return false
  }
  return true
}

export function filterByTableFilters<T>(
  items: readonly T[],
  filters: TableFilterValues,
  getFieldValue: (item: T, fieldId: string) => string | null | undefined
): T[] {
  if (!hasActiveTableFilters(filters)) return [...items]
  return items.filter((item) =>
    matchesTableFilters(filters, (fieldId) => getFieldValue(item, fieldId))
  )
}
