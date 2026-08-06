import { useMemo } from "react"
import type { EntityTableColumn } from "@/components/data/entity-table"

/** Filter EntityTable header columns by Display visibility. */
export function useVisibleEntityColumns(
  allColumns: readonly EntityTableColumn[],
  isColumnVisible: (columnId: string) => boolean
): EntityTableColumn[] {
  return useMemo(
    () => allColumns.filter((column) => isColumnVisible(column.key)),
    [allColumns, isColumnVisible]
  )
}
