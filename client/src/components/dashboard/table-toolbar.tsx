import type { ReactNode } from "react"
import { SearchBar } from "./search-bar"
import { cn } from "@/lib/utils"

interface TableToolbarProps {
  readonly searchPlaceholder?: string
  readonly search: string
  readonly onSearchChange: (value: string) => void
  readonly searchClassName?: string
  /** Rendered on the left, right after the search bar (e.g. filter pills). */
  readonly filters?: ReactNode
  /** Rendered pushed to the far right (e.g. New / Import buttons, view toggle). */
  readonly actions?: ReactNode
  readonly className?: string
}

/**
 * Consistent toolbar that sits directly above a table: search (+ optional
 * filters) on the left, primary actions on the right — so search and the
 * New/Import buttons read as belonging to the table below.
 */
export function TableToolbar({
  searchPlaceholder,
  search,
  onSearchChange,
  searchClassName,
  filters,
  actions,
  className,
}: TableToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <SearchBar
        placeholder={searchPlaceholder}
        value={search}
        onChange={onSearchChange}
        className={searchClassName}
      />
      {filters}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}
