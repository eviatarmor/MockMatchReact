import type { RichTextCaretSnapshot } from "../types"

/**
 * Build a root-relative caret snapshot from the native selection.
 * Returns null when there is no usable range inside `root`.
 */
export function measureCaretInRoot(
  root: HTMLElement,
  fieldId: string
): RichTextCaretSnapshot | null {
  const native = window.getSelection()
  if (!native || native.rangeCount === 0) return null
  const anchor = native.anchorNode
  if (!anchor || !root.contains(anchor)) return null

  const range = native.getRangeAt(0)
  const rootRect = root.getBoundingClientRect()
  const rects = Array.from(range.getClientRects()).filter(
    (r) => r.width > 0 || r.height > 0
  )

  if (rects.length === 0) {
    // Collapsed caret in empty block — use range bounding rect
    const br = range.getBoundingClientRect()
    if (br.height === 0 && br.width === 0) return null
    return {
      fieldId,
      anchorOffset: native.anchorOffset,
      focusOffset: native.focusOffset,
      x: br.left - rootRect.left,
      y: br.top - rootRect.top,
      height: Math.max(br.height, 14),
    }
  }

  const last = rects[rects.length - 1]!
  const mapped = rects.map((r) => ({
    x: r.left - rootRect.left,
    y: r.top - rootRect.top,
    w: Math.max(r.width, 2),
    h: Math.max(r.height, 2),
  }))

  return {
    fieldId,
    anchorOffset: native.anchorOffset,
    focusOffset: native.focusOffset,
    x: last.left - rootRect.left + (native.isCollapsed ? 0 : last.width),
    y: last.top - rootRect.top,
    height: Math.max(last.height, 14),
    rects: native.isCollapsed ? undefined : mapped,
  }
}
