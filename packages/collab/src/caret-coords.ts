/**
 * Caret / selection geometry for collab presence.
 *
 * Rules:
 * - Never mutate live editor DOM (Lexical).
 * - Single-line <input>: X from off-DOM text measure; Y/H from the real
 *   control’s content box in client space (mirror Y under CSS zoom is flaky).
 * - <textarea> / contenteditable: off-DOM mirror or Range rects only.
 *
 * Returned rects are **viewport client** coords (include CSS zoom).
 */

export const MAX_SELECTION_RECTS = 32

/** CSS zoom scale (parent transform). */
export function elementCssScale(el: HTMLElement): {
  scaleX: number
  scaleY: number
} {
  const rect = el.getBoundingClientRect()
  const sx = el.offsetWidth > 0 ? rect.width / el.offsetWidth : 1
  const sy = el.offsetHeight > 0 ? rect.height / el.offsetHeight : 1
  return {
    scaleX: Number.isFinite(sx) && sx > 0 ? sx : 1,
    scaleY: Number.isFinite(sy) && sy > 0 ? sy : 1,
  }
}

function px(value: string): number {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

/** Content box of an input/textarea in **client** (scaled) pixels. */
function contentBoxClient(el: HTMLElement): {
  left: number
  top: number
  width: number
  height: number
  scaleX: number
  scaleY: number
} {
  const elRect = el.getBoundingClientRect()
  const style = window.getComputedStyle(el)
  const { scaleX, scaleY } = elementCssScale(el)
  const bl = px(style.borderLeftWidth) * scaleX
  const br = px(style.borderRightWidth) * scaleX
  const bt = px(style.borderTopWidth) * scaleY
  const bb = px(style.borderBottomWidth) * scaleY
  const pl = px(style.paddingLeft) * scaleX
  const pr = px(style.paddingRight) * scaleX
  const pt = px(style.paddingTop) * scaleY
  const pb = px(style.paddingBottom) * scaleY
  return {
    left: elRect.left + bl + pl,
    top: elRect.top + bt + pt,
    width: Math.max(0, elRect.width - bl - br - pl - pr),
    height: Math.max(0, elRect.height - bt - bb - pt - pb),
    scaleX,
    scaleY,
  }
}

/**
 * Layout-px width of `text` in the field’s font (off-DOM, unscaled).
 * Font props only — no flex, no full box clone.
 */
function measureTextLayoutWidth(
  style: CSSStyleDeclaration,
  text: string
): number {
  if (!text) return 0
  const mirror = document.createElement("span")
  mirror.setAttribute("aria-hidden", "true")
  mirror.style.cssText = [
    "position:absolute",
    "visibility:hidden",
    "pointer-events:none",
    "top:0",
    "left:-9999px",
    "white-space:pre",
    `font-style:${style.fontStyle}`,
    `font-variant:${style.fontVariant}`,
    `font-weight:${style.fontWeight}`,
    `font-stretch:${style.fontStretch}`,
    `font-size:${style.fontSize}`,
    `font-family:${style.fontFamily}`,
    `letter-spacing:${style.letterSpacing}`,
    `text-transform:${style.textTransform}`,
    `text-indent:${style.textIndent}`,
  ].join(";")
  mirror.textContent = text
  document.body.appendChild(mirror)
  const w = mirror.offsetWidth
  document.body.removeChild(mirror)
  return w
}

/**
 * Caret client rect for <input> / <textarea>.
 */
export function getTextFieldCaretClientRect(
  el: HTMLInputElement | HTMLTextAreaElement
): DOMRect | null {
  if (el.selectionStart == null) return null
  const pos = el.selectionStart
  const style = window.getComputedStyle(el)

  if (el instanceof HTMLInputElement) {
    const box = contentBoxClient(el)
    const textW = measureTextLayoutWidth(style, el.value.slice(0, pos))
    // scrollLeft is layout px
    const x =
      box.left + (textW - el.scrollLeft) * box.scaleX
    // Full content-box height — same band as the native single-line caret
    return new DOMRect(x, box.top, Math.max(1, box.scaleX), Math.max(1, box.height))
  }

  // Textarea: block mirror for wrapped lines
  return measureTextareaCaret(el, pos, style)
}

function measureTextareaCaret(
  el: HTMLTextAreaElement,
  pos: number,
  style: CSSStyleDeclaration
): DOMRect {
  const mirror = document.createElement("div")
  mirror.setAttribute("aria-hidden", "true")
  mirror.style.cssText = [
    "position:absolute",
    "visibility:hidden",
    "pointer-events:none",
    "top:0",
    "left:-9999px",
    "box-sizing:border-box",
    `width:${el.offsetWidth}px`,
    `height:${el.offsetHeight}px`,
    `padding:${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
    `border-width:${style.borderTopWidth} ${style.borderRightWidth} ${style.borderBottomWidth} ${style.borderLeftWidth}`,
    "border-style:solid",
    "border-color:transparent",
    `font:${style.font}`,
    `font-size:${style.fontSize}`,
    `font-family:${style.fontFamily}`,
    `font-weight:${style.fontWeight}`,
    `line-height:${style.lineHeight}`,
    `letter-spacing:${style.letterSpacing}`,
    "white-space:pre-wrap",
    "word-wrap:break-word",
    "overflow:hidden",
  ].join(";")

  const prefix = document.createTextNode(el.value.slice(0, pos))
  const marker = document.createElement("span")
  marker.textContent = "\u200b"
  mirror.append(prefix, marker)
  document.body.appendChild(mirror)
  try {
    const mRect = mirror.getBoundingClientRect()
    const kRect = marker.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const { scaleX, scaleY } = elementCssScale(el)
    const layoutX = kRect.left - mRect.left - el.scrollLeft
    const layoutY = kRect.top - mRect.top - el.scrollTop
    const fontSize = px(style.fontSize) || 16
    const layoutH = Math.max(kRect.height || 0, fontSize)
    return new DOMRect(
      elRect.left + layoutX * scaleX,
      elRect.top + layoutY * scaleY,
      Math.max(1, scaleX),
      layoutH * scaleY
    )
  } finally {
    document.body.removeChild(mirror)
  }
}

/**
 * Selection client rects for <input> / <textarea>. Empty when caret-only.
 */
export function getTextFieldSelectionClientRects(
  el: HTMLInputElement | HTMLTextAreaElement
): DOMRect[] {
  if (el.selectionStart == null || el.selectionEnd == null) return []
  const start = el.selectionStart
  const end = el.selectionEnd
  if (start === end) return []

  const style = window.getComputedStyle(el)

  if (el instanceof HTMLInputElement) {
    const box = contentBoxClient(el)
    const a = measureTextLayoutWidth(style, el.value.slice(0, start))
    const b = measureTextLayoutWidth(style, el.value.slice(0, end))
    const left =
      box.left + (Math.min(a, b) - el.scrollLeft) * box.scaleX
    const right =
      box.left + (Math.max(a, b) - el.scrollLeft) * box.scaleX
    return [
      new DOMRect(
        left,
        box.top,
        Math.max(2, right - left),
        Math.max(1, box.height)
      ),
    ]
  }

  // Textarea multi-line selection via mirror
  const mirror = document.createElement("div")
  mirror.style.cssText = [
    "position:absolute",
    "visibility:hidden",
    "top:0",
    "left:-9999px",
    "box-sizing:border-box",
    `width:${el.offsetWidth}px`,
    `height:${el.offsetHeight}px`,
    `padding:${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
    `border-width:${style.borderTopWidth} ${style.borderRightWidth} ${style.borderBottomWidth} ${style.borderLeftWidth}`,
    "border-style:solid",
    "border-color:transparent",
    `font:${style.font}`,
    `line-height:${style.lineHeight}`,
    `letter-spacing:${style.letterSpacing}`,
    "white-space:pre-wrap",
    "word-wrap:break-word",
    "overflow:hidden",
  ].join(";")
  const before = document.createTextNode(el.value.slice(0, start))
  const mid = document.createElement("span")
  mid.textContent = el.value.slice(start, end) || "\u200b"
  const after = document.createTextNode(el.value.slice(end))
  mirror.append(before, mid, after)
  document.body.appendChild(mirror)
  try {
    const mRect = mirror.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const { scaleX, scaleY } = elementCssScale(el)
    return Array.from(mid.getClientRects())
      .filter((r) => r.width > 0 || r.height > 0)
      .slice(0, MAX_SELECTION_RECTS)
      .map((r) => {
        const layoutX = r.left - mRect.left - el.scrollLeft
        const layoutY = r.top - mRect.top - el.scrollTop
        return new DOMRect(
          elRect.left + layoutX * scaleX,
          elRect.top + layoutY * scaleY,
          Math.max(scaleX, r.width * scaleX),
          Math.max(scaleY, r.height * scaleY)
        )
      })
  } finally {
    document.body.removeChild(mirror)
  }
}

/**
 * ContentEditable / Lexical caret — read-only Range geometry only.
 */
export function getDomSelectionCaretClientRect(): DOMRect | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null

  const range = sel.getRangeAt(0)
  let probe: Range
  if (range.collapsed) {
    probe = range
  } else {
    probe = range.cloneRange()
    probe.collapse(false)
  }

  const rects = probe.getClientRects()
  let rect: DOMRect | null =
    rects.length > 0 ? rects[rects.length - 1]! : null
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    const br = probe.getBoundingClientRect()
    if (br.height > 0 || br.width > 0) rect = br
  }
  if (!rect || rect.height <= 0) return null

  // Soft-clamp very tall line boxes (keep top, trim bottom)
  const node = sel.focusNode
  const el =
    node instanceof Element
      ? node
      : node?.parentElement instanceof Element
        ? node.parentElement
        : null
  if (el) {
    const fontSize = px(window.getComputedStyle(el).fontSize) || 16
    const maxH = fontSize * 1.45
    if (rect.height > maxH) {
      return new DOMRect(rect.left, rect.top, Math.max(1, rect.width || 1), maxH)
    }
  }

  return new DOMRect(
    rect.left,
    rect.top,
    Math.max(1, rect.width || 1),
    rect.height
  )
}

export function getDomSelectionClientRects(): DOMRect[] {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return []
  return Array.from(sel.getRangeAt(0).getClientRects())
    .filter((r) => r.width > 0 || r.height > 0)
    .slice(0, MAX_SELECTION_RECTS)
}
