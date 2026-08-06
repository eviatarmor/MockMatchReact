import { useCallback, useMemo, useState } from "react"

export interface TableDisplayColumnDef {
  readonly id: string
  readonly label: string
  /** Primary name / actions — always shown, not toggleable. */
  readonly locked?: boolean
  /** Defaults to true when omitted. */
  readonly defaultVisible?: boolean
}

export type ColumnVisibility = Readonly<Record<string, boolean>>

function buildDefaults(
  columns: readonly TableDisplayColumnDef[]
): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const column of columns) {
    next[column.id] =
      column.locked === true ? true : column.defaultVisible !== false
  }
  return next
}

export function useTableColumnVisibility(
  columns: readonly TableDisplayColumnDef[]
) {
  const defaults = useMemo(() => buildDefaults(columns), [columns])
  const [visibility, setVisibility] = useState<Record<string, boolean>>(defaults)

  const isVisible = useCallback(
    (columnId: string) => {
      if (visibility[columnId] === undefined) {
        return defaults[columnId] !== false
      }
      return visibility[columnId] !== false
    },
    [visibility, defaults]
  )

  const toggle = useCallback(
    (columnId: string) => {
      const column = columns.find((item) => item.id === columnId)
      if (column?.locked) return
      setVisibility((prev) => ({
        ...prev,
        // undefined/true = visible → flip to false; false = hidden → flip to true
        [columnId]: prev[columnId] === false,
      }))
    },
    [columns]
  )

  const reset = useCallback(() => {
    setVisibility(buildDefaults(columns))
  }, [columns])

  const visibleColumnIds = useMemo(
    () => columns.filter((column) => isVisible(column.id)).map((c) => c.id),
    [columns, isVisible]
  )

  return {
    visibility,
    isVisible,
    toggle,
    reset,
    visibleColumnIds,
  }
}
