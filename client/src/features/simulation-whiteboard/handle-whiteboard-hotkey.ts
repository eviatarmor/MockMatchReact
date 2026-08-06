import {
  isViewSafeWhiteboardTool,
  shapeKindFromHotkey,
  toolFromHotkey,
  type ShapeKind,
  type WhiteboardTool,
} from "@mockmatch/whiteboard"

export type WhiteboardHotkeyContext = {
  readonly canEditBoard: boolean
  readonly tool: WhiteboardTool
  readonly getSelectedIds: () => readonly string[]
  readonly undo: () => void
  readonly redo: () => void
  readonly removeSelected: (ids: string[]) => void
  readonly clearSelection: () => void
  readonly setTool: (tool: WhiteboardTool) => void
  readonly setShapeKind: (kind: ShapeKind) => void
}

function isRichTextTarget(target: HTMLElement): boolean {
  if (target.isContentEditable) return true
  return Boolean(target.closest('[contenteditable="true"]'))
}

function isFormField(target: HTMLElement): boolean {
  return target.tagName === "TEXTAREA" || target.tagName === "INPUT"
}

/** Sticky textarea: only block board keys when that sticky is sole selection. */
function inputBlocksBoardKeys(
  target: HTMLElement,
  selectedIds: readonly string[]
): boolean {
  if (selectedIds.length === 0) return true
  if (selectedIds.length !== 1) return false
  const elId = target.closest("[data-el-id]")?.getAttribute("data-el-id")
  return Boolean(elId && selectedIds[0] === elId)
}

export function isTypingInField(
  target: EventTarget | null,
  selectedIds: readonly string[]
): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (isRichTextTarget(target)) return true
  if (!isFormField(target)) return false
  return inputBlocksBoardKeys(target, selectedIds)
}

function isModKey(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey
}

function isDeleteKey(key: string): boolean {
  return key === "Delete" || key === "Backspace"
}

function hasModifierChord(e: KeyboardEvent): boolean {
  return Boolean(e.metaKey || e.ctrlKey || e.altKey)
}

function runUndoOrRedo(
  shiftKey: boolean,
  undo: () => void,
  redo: () => void
): void {
  if (shiftKey) redo()
  else undo()
}

function tryCtrlZ(
  e: KeyboardEvent,
  canEdit: boolean,
  undo: () => void,
  redo: () => void
): boolean {
  if (!isModKey(e)) return false
  if (e.key.toLowerCase() !== "z") return false
  if (!canEdit) return true
  e.preventDefault()
  runUndoOrRedo(e.shiftKey, undo, redo)
  return true
}

function tryCtrlY(
  e: KeyboardEvent,
  canEdit: boolean,
  redo: () => void
): boolean {
  if (!isModKey(e)) return false
  if (e.key.toLowerCase() !== "y") return false
  if (!canEdit) return true
  e.preventDefault()
  redo()
  return true
}

function tryDeleteKey(
  e: KeyboardEvent,
  canEdit: boolean,
  getSelectedIds: () => readonly string[],
  removeSelected: (ids: string[]) => void,
  clearSelection: () => void
): boolean {
  if (!isDeleteKey(e.key)) return false
  if (!canEdit) return true
  const ids = getSelectedIds()
  if (ids.length === 0) return true
  e.preventDefault()
  removeSelected([...ids])
  clearSelection()
  return true
}

function tryEscape(
  e: KeyboardEvent,
  clearSelection: () => void,
  setTool: (tool: WhiteboardTool) => void
): boolean {
  if (e.key !== "Escape") return false
  e.preventDefault()
  clearSelection()
  setTool("select")
  return true
}

function tryShapeKindHotkey(
  e: KeyboardEvent,
  canEdit: boolean,
  tool: WhiteboardTool,
  setShapeKind: (kind: ShapeKind) => void
): boolean {
  if (!canEdit) return false
  if (tool !== "shape") return false
  const sk = shapeKindFromHotkey(e.key)
  if (!sk) return false
  e.preventDefault()
  setShapeKind(sk)
  return true
}

function tryToolHotkey(
  e: KeyboardEvent,
  canEdit: boolean,
  setTool: (tool: WhiteboardTool) => void
): boolean {
  const nextTool = toolFromHotkey(e.key, { shiftKey: e.shiftKey })
  if (!nextTool) return false
  if (!canEdit && !isViewSafeWhiteboardTool(nextTool)) return false
  e.preventDefault()
  setTool(nextTool)
  return true
}

function tryEditChords(
  e: KeyboardEvent,
  ctx: WhiteboardHotkeyContext
): boolean {
  if (tryCtrlZ(e, ctx.canEditBoard, ctx.undo, ctx.redo)) return true
  if (tryCtrlY(e, ctx.canEditBoard, ctx.redo)) return true
  return tryDeleteKey(
    e,
    ctx.canEditBoard,
    ctx.getSelectedIds,
    ctx.removeSelected,
    ctx.clearSelection
  )
}

function tryPlainHotkeys(
  e: KeyboardEvent,
  ctx: WhiteboardHotkeyContext
): boolean {
  if (hasModifierChord(e)) return false
  if (tryEscape(e, ctx.clearSelection, ctx.setTool)) return true
  if (tryShapeKindHotkey(e, ctx.canEditBoard, ctx.tool, ctx.setShapeKind)) {
    return true
  }
  return tryToolHotkey(e, ctx.canEditBoard, ctx.setTool)
}

/**
 * Window-level whiteboard hotkeys (undo/redo/delete/tools).
 * Keeps canEditBoard + view-safe tool guards.
 */
export function handleWhiteboardHotkey(
  e: KeyboardEvent,
  ctx: WhiteboardHotkeyContext
): void {
  if (isTypingInField(e.target, ctx.getSelectedIds())) return
  if (tryEditChords(e, ctx)) return
  tryPlainHotkeys(e, ctx)
}
