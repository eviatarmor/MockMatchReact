import type { ReactNode } from "react"
import {
  TableDisplayMenu,
} from "@/components/data/table-display-menu"
import {
  TableFilterMenu,
  type TableFilterField,
} from "@/components/data/table-filter-menu"
import type { TableDisplayColumnDef } from "@/hooks/use-table-column-visibility"

interface TableChromeControlsProps {
  readonly filterFields: readonly TableFilterField[]
  readonly isValueSelected: (fieldId: string, value: string) => boolean
  readonly onToggleValue: (fieldId: string, value: string) => void
  readonly onClearAll?: () => void
  readonly activeCount?: number
  readonly displayColumns: readonly TableDisplayColumnDef[]
  readonly isColumnVisible: (columnId: string) => boolean
  readonly onToggleColumn: (columnId: string) => void
  /** When false, Display menu is omitted (e.g. grid view). Default true. */
  readonly showDisplay?: boolean
  /** Optional trailing chrome (e.g. ViewModeTabs). */
  readonly trailing?: ReactNode
}

/**
 * Shared Filter + Display toolbar chrome for entity tables.
 * Keeps page toolbars thin and avoids copy-paste across list pages.
 */
export function TableChromeControls({
  filterFields,
  isValueSelected,
  onToggleValue,
  onClearAll,
  activeCount = 0,
  displayColumns,
  isColumnVisible,
  onToggleColumn,
  showDisplay = true,
  trailing,
}: TableChromeControlsProps) {
  return (
    <>
      <TableFilterMenu
        fields={filterFields}
        isValueSelected={isValueSelected}
        onToggleValue={onToggleValue}
        onClearAll={onClearAll}
        activeCount={activeCount}
      />
      {showDisplay ? (
        <TableDisplayMenu
          columns={displayColumns}
          isVisible={isColumnVisible}
          onToggle={onToggleColumn}
        />
      ) : null}
      {trailing}
    </>
  )
}
