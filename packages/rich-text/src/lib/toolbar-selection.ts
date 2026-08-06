import type { LexicalEditor } from "lexical"
import { $getSelection, $isRangeSelection } from "lexical"

export type ToolbarAnchor = { top: number; left: number }

/**
 * Resolve floating-toolbar position for a non-empty selection inside the
 * focused editor root. Returns null when the toolbar should hide.
 */
export function measureToolbarAnchor(
  editor: LexicalEditor
): ToolbarAnchor | null {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || selection.isCollapsed()) return null

  const native = window.getSelection()
  const root = editor.getRootElement()
  if (!native || native.rangeCount === 0 || !root) return null
  if (document.activeElement !== root) return null
  if (!root.contains(native.anchorNode)) return null

  const rect = native.getRangeAt(0).getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  return { top: rect.top, left: rect.left + rect.width / 2 }
}
