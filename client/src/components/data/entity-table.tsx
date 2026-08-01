import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface EntityTableColumn {
  readonly key: string
  readonly label?: string
  readonly className?: string
}

interface EntityTableProps {
  readonly columns: readonly EntityTableColumn[]
  readonly isEmpty: boolean
  readonly emptyMessage: string
  readonly children: ReactNode // <tr> rows for the table body
  readonly className?: string
}

/**
 * Card-framed table shell: shared header, body, empty state.
 *
 * Row entrance stagger is applied here via `.entity-table-body` (see index.css) —
 * row components should render plain `<tr>`, not `StaggerItem as="tr"`.
 * Matches `STAGGER` in `@/components/ui/stagger` (first 12 rows cascade).
 */
export function EntityTable({
  columns,
  isEmpty,
  emptyMessage,
  children,
  className,
}: EntityTableProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/5",
        className
      )}
    >
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border/60 bg-muted/5 text-2xs font-medium text-muted-foreground select-none">
            {columns.map((column) => (
              <th key={column.key} className={cn("px-4 py-3 font-semibold", column.className)}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="entity-table-body divide-y divide-border/40">
          {isEmpty ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  )
}
