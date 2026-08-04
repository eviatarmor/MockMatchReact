import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { cn } from "@mockmatch/ui/utils"
import type { SpreadsheetCommand } from "./commands"
import { SpreadsheetGrid } from "./grid/spreadsheet-grid"
import {
  collectChrome,
  sortPlugins,
  type SpreadsheetPlugin,
  type SpreadsheetPluginContext,
} from "./plugin-system"
import { createDefaultPlugins } from "./plugins"
import type {
  CellCoord,
  DisplayCell,
  SpreadsheetDocument,
  SpreadsheetSelection,
  SpreadsheetShellLabels,
} from "./types"

export type SpreadsheetShellProps = {
  readonly document: SpreadsheetDocument
  readonly selection: SpreadsheetSelection
  readonly labels: SpreadsheetShellLabels
  readonly getDisplay: (row: number, col: number) => DisplayCell
  readonly formulaDraft: string
  readonly onFormulaDraftChange: (v: string) => void
  readonly onSelectionChange: (
    active: CellCoord,
    rangeEnd?: CellCoord | null
  ) => void
  readonly onDispatch: (command: SpreadsheetCommand) => void
  /**
   * Unified plugins (selection, keyboard, chrome, …).
   * Default: createDefaultPlugins(). Pass [] for bare grid core.
   */
  readonly plugins?: readonly SpreadsheetPlugin[]
  readonly readOnly?: boolean
  /** Optional top chrome (IdeChromeBar, menubar, …). */
  readonly chrome?: ReactNode
  readonly className?: string
}

/**
 * Full-height spreadsheet surface: host chrome → plugin top chrome →
 * virtualized grid → plugin bottom chrome.
 * Host owns session transport, collab room, and AI panel.
 */
export function SpreadsheetShell({
  document,
  selection,
  labels,
  getDisplay,
  formulaDraft,
  onFormulaDraftChange,
  onSelectionChange,
  onDispatch,
  plugins: pluginsProp,
  readOnly = false,
  chrome,
  className,
}: SpreadsheetShellProps) {
  const defaultPluginsRef = useRef<SpreadsheetPlugin[] | null>(null)
  if (!defaultPluginsRef.current) {
    defaultPluginsRef.current = createDefaultPlugins()
  }
  const plugins = pluginsProp ?? defaultPluginsRef.current
  const sortedPlugins = useMemo(() => sortPlugins(plugins), [plugins])

  const [editing, setEditing] = useState(false)
  /** Formula bar focused — drives grid ref highlights without in-cell editor. */
  const [formulaBarActive, setFormulaBarActive] = useState(false)

  const documentRef = useRef(document)
  documentRef.current = document
  const selectionRef = useRef(selection)
  selectionRef.current = selection
  const formulaDraftRef = useRef(formulaDraft)
  formulaDraftRef.current = formulaDraft
  const editingRef = useRef(editing)
  editingRef.current = editing
  const formulaBarActiveRef = useRef(formulaBarActive)
  formulaBarActiveRef.current = formulaBarActive
  const formulaCaretRef = useRef(formulaDraft.length)

  // End edit when switching sheets
  useEffect(() => {
    setEditing(false)
    setFormulaBarActive(false)
  }, [document.activeSheetId])
  const labelsRef = useRef(labels)
  labelsRef.current = labels
  const getDisplayRef = useRef(getDisplay)
  getDisplayRef.current = getDisplay
  const onDispatchRef = useRef(onDispatch)
  onDispatchRef.current = onDispatch
  const onSelectionChangeRef = useRef(onSelectionChange)
  onSelectionChangeRef.current = onSelectionChange
  const onFormulaDraftChangeRef = useRef(onFormulaDraftChange)
  onFormulaDraftChangeRef.current = onFormulaDraftChange
  const readOnlyRef = useRef(readOnly)
  readOnlyRef.current = readOnly

  const scrollCellIntoViewRef = useRef<
    ((coord: CellCoord) => void) | undefined
  >(undefined)
  const getActiveCellRectRef = useRef<
    (() => { left: number; top: number; width: number; height: number } | null) | undefined
  >(undefined)

  const commitActiveCell = useCallback(() => {
    const { row, col } = selectionRef.current.active
    onDispatchRef.current({
      type: "setCell",
      row,
      col,
      raw: formulaDraftRef.current,
    })
  }, [])

  const ctx: SpreadsheetPluginContext = useMemo(
    () => ({
      getDocument: () => documentRef.current,
      getSelection: () => selectionRef.current,
      getFormulaDraft: () => formulaDraftRef.current,
      isEditing: () => editingRef.current,
      canEdit: () => !readOnlyRef.current,
      getDisplay: (row, col) => getDisplayRef.current(row, col),
      getLabels: () => labelsRef.current,
      setSelection: (active, rangeEnd) =>
        onSelectionChangeRef.current(active, rangeEnd),
      setFormulaDraft: (v) => onFormulaDraftChangeRef.current(v),
      setEditing: (v) => {
        editingRef.current = v
        setEditing(v)
      },
      dispatch: (cmd) => onDispatchRef.current(cmd),
      scrollCellIntoView: (coord) => scrollCellIntoViewRef.current?.(coord),
      getActiveCellRect: () => getActiveCellRectRef.current?.() ?? null,
      commitActiveCell,
      getFormulaCaret: () => formulaCaretRef.current,
      setFormulaCaret: (n) => {
        formulaCaretRef.current = Math.max(0, n)
      },
      isFormulaBarActive: () => formulaBarActiveRef.current,
      setFormulaBarActive: (active) => {
        formulaBarActiveRef.current = active
        setFormulaBarActive(active)
      },
    }),
    [commitActiveCell]
  )

  // Plugin setup lifecycle
  useEffect(() => {
    const cleanups: Array<void | (() => void)> = []
    for (const p of sortedPlugins) {
      cleanups.push(p.setup?.(ctx))
    }
    return () => {
      for (const c of cleanups) {
        if (typeof c === "function") c()
      }
    }
  }, [sortedPlugins, ctx])

  const topChrome = collectChrome(sortedPlugins, ctx, "top")
  const bottomChrome = collectChrome(sortedPlugins, ctx, "bottom")
  const overlayChrome = collectChrome(sortedPlugins, ctx, "overlay")

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-background",
        className
      )}
    >
      {chrome ? (
        <div className="z-20 shrink-0">{chrome}</div>
      ) : null}
      {topChrome.map((node, i) => (
        <div key={`top-${i}`} className="shrink-0">
          {node}
        </div>
      ))}
      {/* h-0 + flex-1: take remaining column height (absolute grid needs definite size) */}
      <SpreadsheetGrid
        className="h-0 min-h-0 flex-1"
        document={document}
        selection={selection}
        getDisplay={getDisplay}
        formulaDraft={formulaDraft}
        plugins={sortedPlugins}
        ctx={ctx}
        editing={editing}
        formulaBarActive={formulaBarActive}
        ariaLabel={labels.gridAria}
        bindScrollCellIntoView={(fn) => {
          scrollCellIntoViewRef.current = fn
        }}
        bindGetActiveCellRect={(fn) => {
          getActiveCellRectRef.current = fn
        }}
      />
      {bottomChrome.map((node, i) => (
        <div key={`bottom-${i}`} className="shrink-0">
          {node}
        </div>
      ))}
      {overlayChrome.length > 0 ? (
        <div className="pointer-events-none absolute inset-0 z-30">
          {overlayChrome.map((node, i) => (
            <div key={`overlay-${i}`} className="pointer-events-auto">
              {node}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
