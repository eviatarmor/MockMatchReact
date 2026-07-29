const MIRROR_STYLE_PROPS = [
  "direction",
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
  "whiteSpace",
  "wordBreak",
  "overflowWrap",
] as const

/** Cap multi-line selection boxes sent over the wire. */
export const MAX_SELECTION_RECTS = 32

function buildTextFieldMirror(
  el: HTMLInputElement | HTMLTextAreaElement
): { mirror: HTMLDivElement; style: CSSStyleDeclaration; isTextArea: boolean } {
  const style = window.getComputedStyle(el)
  const isTextArea = el instanceof HTMLTextAreaElement
  const mirror = document.createElement("div")

  mirror.style.position = "absolute"
  mirror.style.visibility = "hidden"
  mirror.style.whiteSpace = isTextArea ? "pre-wrap" : "pre"
  mirror.style.wordWrap = "break-word"
  mirror.style.top = "0"
  mirror.style.left = "-9999px"

  for (const prop of MIRROR_STYLE_PROPS) {
    mirror.style.setProperty(prop, style.getPropertyValue(prop))
  }

  if (!isTextArea) {
    mirror.style.whiteSpace = "pre"
    mirror.style.overflow = "hidden"
  }

  return { mirror, style, isTextArea }
}

function mapMirrorRectToClient(
  el: HTMLInputElement | HTMLTextAreaElement,
  style: CSSStyleDeclaration,
  mirrorRect: DOMRect,
  target: DOMRect
): DOMRect {
  const elRect = el.getBoundingClientRect()
  const x =
    elRect.left +
    (target.left - mirrorRect.left) -
    el.scrollLeft +
    Number.parseFloat(style.borderLeftWidth || "0")
  const y =
    elRect.top +
    (target.top - mirrorRect.top) -
    el.scrollTop +
    Number.parseFloat(style.borderTopWidth || "0")
  return new DOMRect(x, y, target.width, target.height)
}

/**
 * Approximate caret (text insertion point) client rect for <input> / <textarea>.
 * Mirror-div technique so we can place remote colored carets.
 */
export function getTextFieldCaretClientRect(
  el: HTMLInputElement | HTMLTextAreaElement
): DOMRect | null {
  const pos = el.selectionStart ?? 0
  const { mirror, style } = buildTextFieldMirror(el)

  const value = el.value.slice(0, pos)
  mirror.textContent = value
  const marker = document.createElement("span")
  marker.textContent = "\u200b"
  mirror.appendChild(marker)

  document.body.appendChild(mirror)
  const markerRect = marker.getBoundingClientRect()
  const mirrorRect = mirror.getBoundingClientRect()
  const mapped = mapMirrorRectToClient(el, style, mirrorRect, markerRect)
  const height = Number.parseFloat(style.lineHeight) || mapped.height || 16
  document.body.removeChild(mirror)

  return new DOMRect(mapped.x, mapped.y, 1, height)
}

/**
 * Client rects covering a non-collapsed selection inside <input> / <textarea>.
 * Empty when caret-only (start === end).
 */
export function getTextFieldSelectionClientRects(
  el: HTMLInputElement | HTMLTextAreaElement
): DOMRect[] {
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  if (start === end) return []

  const { mirror, style } = buildTextFieldMirror(el)
  const value = el.value
  const before = document.createTextNode(value.slice(0, start))
  const selected = document.createElement("span")
  selected.textContent = value.slice(start, end) || "\u200b"
  const after = document.createTextNode(value.slice(end))
  mirror.append(before, selected, after)

  document.body.appendChild(mirror)
  const mirrorRect = mirror.getBoundingClientRect()
  const raw = Array.from(selected.getClientRects())
  const out = raw
    .filter((r) => r.width > 0 || r.height > 0)
    .slice(0, MAX_SELECTION_RECTS)
    .map((r) => mapMirrorRectToClient(el, style, mirrorRect, r))
  document.body.removeChild(mirror)
  return out
}

/** Client rect for a DOM Selection caret (contenteditable / Lexical). */
export function getDomSelectionCaretClientRect(): DOMRect | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0).cloneRange()
  if (!range.collapsed) {
    // Use focus end for multi-select
    range.collapse(false)
  }
  let rect = range.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) {
    const span = document.createElement("span")
    span.textContent = "\u200b"
    range.insertNode(span)
    rect = span.getBoundingClientRect()
    span.parentNode?.removeChild(span)
    sel.removeAllRanges()
    sel.addRange(range)
  }
  if (rect.height === 0) return null
  return rect
}

/** Client rects for a non-collapsed DOM Selection (Lexical / contenteditable). */
export function getDomSelectionClientRects(): DOMRect[] {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return []
  const range = sel.getRangeAt(0)
  return Array.from(range.getClientRects())
    .filter((r) => r.width > 0 || r.height > 0)
    .slice(0, MAX_SELECTION_RECTS)
}
