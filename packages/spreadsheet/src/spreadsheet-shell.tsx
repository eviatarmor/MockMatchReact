import type { ReactNode } from "react"
import { cn } from "@mockmatch/ui/utils"
import { FormulaBar } from "./formula-bar"
import { SpreadsheetGrid } from "./grid/spreadsheet-grid"
import { SheetTabs } from "./sheet-tabs"
import type {
  CellCoord,
  DisplayCell,
  SpreadsheetDocument,
  SpreadsheetSelection,
  SpreadsheetShellLabels,
} from "./types"
import { toA1 } from "./address"

export type SpreadsheetShellProps = {
  readonly document: SpreadsheetDocument
  readonly selection: SpreadsheetSelection
  readonly labels: SpreadsheetShellLabels
  readonly getDisplay: (row: number, col: number) => DisplayCell
  readonly onSelect: (active: CellCoord, rangeEnd?: CellCoord | null) => void
  readonly onCommitCell: (row: number, col: number, raw: string) => void
  readonly formulaDraft: string
  readonly onFormulaDraftChange: (v: string) => void
  readonly onFormulaCommit: () => void
  readonly onSetActiveSheet: (id: string) => void
  readonly onAddSheet: () => void
  readonly onRenameSheet: (id: string, name: string) => void
  readonly onDeleteSheet: (id: string) => void
  readonly readOnly?: boolean
  /** Optional top chrome (IdeChromeBar, menubar, …). */
  readonly chrome?: ReactNode
  readonly className?: string
}

/**
 * Full-height spreadsheet surface: chrome → formula bar → virtualized grid → sheet tabs.
 * Host owns session transport, collab room, and AI panel.
 */
export function SpreadsheetShell({
  document,
  selection,
  labels,
  getDisplay,
  onSelect,
  onCommitCell,
  formulaDraft,
  onFormulaDraftChange,
  onFormulaCommit,
  onSetActiveSheet,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
  readOnly = false,
  chrome,
  className,
}: SpreadsheetShellProps) {
  const a1 = toA1(selection.active.row, selection.active.col)

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden bg-background",
        className
      )}
    >
      {chrome ? <div className="z-20 shrink-0">{chrome}</div> : null}
      <FormulaBar
        a1={a1}
        value={formulaDraft}
        onChange={onFormulaDraftChange}
        onCommit={onFormulaCommit}
        readOnly={readOnly}
        nameBoxAria={labels.nameBoxAria}
        formulaBarAria={labels.formulaBarAria}
      />
      <SpreadsheetGrid
        document={document}
        selection={selection}
        getDisplay={getDisplay}
        onSelect={onSelect}
        onCommitCell={onCommitCell}
        formulaDraft={formulaDraft}
        onFormulaDraftChange={onFormulaDraftChange}
        readOnly={readOnly}
        ariaLabel={labels.gridAria}
      />
      <SheetTabs
        sheets={document.sheets}
        activeSheetId={document.activeSheetId}
        onSelect={onSetActiveSheet}
        onAdd={onAddSheet}
        onRename={onRenameSheet}
        onDelete={onDeleteSheet}
        readOnly={readOnly}
        labels={{
          sheetTabsAria: labels.sheetTabsAria,
          addSheet: labels.addSheet,
          renameSheet: labels.renameSheet,
          deleteSheet: labels.deleteSheet,
          cannotDeleteLastSheet: labels.cannotDeleteLastSheet,
        }}
      />
    </div>
  )
}
