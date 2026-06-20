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
}

// Card-framed table shell: shared header row, body, and empty state. Callers
// own the row markup so each entity renders its own columns.
export function EntityTable({ columns, isEmpty, emptyMessage, children }: EntityTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
            {columns.map((column) => (
              <th key={column.key} className={cn("py-3 px-4 font-bold", column.className)}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {isEmpty ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">
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
