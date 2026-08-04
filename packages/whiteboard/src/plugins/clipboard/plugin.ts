import {
  isBoardEmpty,
  maxZ,
  preparePaste,
  sliceDocument,
} from "../../document"
import type { WhiteboardDocument } from "../../types"
import type {
  WhiteboardPlugin,
  WhiteboardPluginContext,
} from "../../plugin-system"

/**
 * Ctrl/Cmd+C copy, +X cut, +V paste for the current selection.
 */
export function createClipboardPlugin(): WhiteboardPlugin {
  let clipboard: WhiteboardDocument | null = null
  let pasteCount = 0

  const copySelection = (ctx: WhiteboardPluginContext): boolean => {
    if (!ctx.canEdit()) return false
    const ids = ctx.getSelectedIds()
    if (ids.length === 0) return false
    const slice = sliceDocument(ctx.getDocument(), ids)
    if (isBoardEmpty(slice)) return false
    clipboard = slice
    pasteCount = 0
    return true
  }

  const pasteSelection = (ctx: WhiteboardPluginContext): boolean => {
    if (!ctx.canEdit()) return false
    if (!clipboard || isBoardEmpty(clipboard)) return false
    pasteCount += 1
    const { elements, ids } = preparePaste(clipboard, {
      pasteIndex: pasteCount,
      zBase: maxZ(ctx.getDocument()),
    })
    if (elements.length === 0) return false
    ctx.dispatch({ type: "upsertMany", elements })
    ctx.setSelectedIds(ids)
    ctx.setEditingId(null)
    return true
  }

  const cutSelection = (ctx: WhiteboardPluginContext): boolean => {
    if (!ctx.canEdit()) return false
    const ids = [...ctx.getSelectedIds()]
    if (!copySelection(ctx)) return false
    ctx.dispatch({ type: "remove", ids })
    ctx.setSelectedIds([])
    ctx.setEditingId(null)
    return true
  }

  return {
    id: "clipboard",
    order: 10,
    onKeyDown(e, ctx) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return false
      if (ctx.isNativeTextTarget(e.target)) return false

      const code = e.code
      const key = e.key.toLowerCase()
      const isC = code === "KeyC" || key === "c"
      const isX = code === "KeyX" || key === "x"
      const isV = code === "KeyV" || key === "v"
      if (!isC && !isX && !isV) return false

      if (isC) {
        if (ctx.getSelectedIds().length === 0) return false
        e.preventDefault()
        e.stopPropagation()
        return copySelection(ctx)
      }
      if (isX) {
        if (ctx.getSelectedIds().length === 0) return false
        e.preventDefault()
        e.stopPropagation()
        return cutSelection(ctx)
      }
      if (!clipboard || isBoardEmpty(clipboard)) return false
      e.preventDefault()
      e.stopPropagation()
      return pasteSelection(ctx)
    },
  }
}

export const clipboardPlugin = createClipboardPlugin
