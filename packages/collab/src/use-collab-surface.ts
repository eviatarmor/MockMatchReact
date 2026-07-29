import { useCallback, useEffect, useRef, useState } from "react"
import {
  getDomSelectionCaretClientRect,
  getDomSelectionClientRects,
  getTextFieldCaretClientRect,
  getTextFieldSelectionClientRects,
} from "./caret-coords"
import type { CollabCursorKind, CollabNormRect } from "./types"

export type SendCursor = (
  x: number,
  y: number,
  kind?: CollabCursorKind,
  h?: number,
  rects?: CollabNormRect[]
) => void

export type UseCollabSurfaceOptions = {
  /**
   * When false (default), paper-relative coords are **not** clamped to 0–1 so
   * peers can see the pointer on the background grid outside the page.
   */
  readonly clamp?: boolean
}

/**
 * Track paper size + pointer/caret/selection in **paper-relative** space
 * (origin = paper top-left; 1 = paper width/height). Values may be outside
 * [0,1] when the pointer is on the surrounding canvas grid.
 *
 * - `surfaceRef` → paper (size + caret space)
 * - `bindViewport` → full canvas/grid layer that receives pointer moves
 */
export function useCollabSurface(
  sendCursor: SendCursor,
  clearCursor?: () => void,
  options?: UseCollabSurfaceOptions
) {
  const clamp = options?.clamp ?? false
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [surfaceSize, setSurfaceSize] = useState({ w: 1, h: 1 })
  const sizeRef = useRef(surfaceSize)
  sizeRef.current = surfaceSize

  useEffect(() => {
    const el = surfaceRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) {
        setSurfaceSize({ w: width, h: height })
      }
    })
    ro.observe(el)
    const rect = el.getBoundingClientRect()
    setSurfaceSize({
      w: el.offsetWidth || rect.width,
      h: el.offsetHeight || rect.height,
    })
    return () => ro.disconnect()
  }, [])

  const clientToPaper = useCallback(
    (clientX: number, clientY: number) => {
      const el = surfaceRef.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return null
      let x = (clientX - rect.left) / rect.width
      let y = (clientY - rect.top) / rect.height
      if (clamp) {
        x = Math.min(1, Math.max(0, x))
        y = Math.min(1, Math.max(0, y))
      }
      return { x, y }
    },
    [clamp]
  )

  const clientRectToNorm = useCallback((r: DOMRect): CollabNormRect | null => {
    const el = surfaceRef.current
    if (!el) return null
    const srect = el.getBoundingClientRect()
    if (srect.width <= 0 || srect.height <= 0) return null
    const scaleX = srect.width / (el.offsetWidth || srect.width)
    const scaleY = srect.height / (el.offsetHeight || srect.height)
    if (scaleX <= 0 || scaleY <= 0) return null
    const x = (r.left - srect.left) / srect.width
    const y = (r.top - srect.top) / srect.height
    const w = r.width / scaleX / (el.offsetWidth || 1)
    const h = r.height / scaleY / (el.offsetHeight || 1)
    return {
      x,
      y,
      w: Math.max(0, w),
      h: Math.max(0, h),
    }
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const surface = surfaceRef.current
      const active = document.activeElement
      if (
        surface &&
        active instanceof HTMLElement &&
        surface.contains(active) &&
        (active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active.isContentEditable ||
          active.closest("[contenteditable=true]"))
      ) {
        return
      }
      const n = clientToPaper(e.clientX, e.clientY)
      if (!n) return
      sendCursor(n.x, n.y, "pointer")
    },
    [clientToPaper, sendCursor]
  )

  const onPointerLeave = useCallback(() => {
    clearCursor?.()
  }, [clearCursor])

  /**
   * Attach pointer listeners to a viewport element (full grid / transform wrapper).
   * Call with the wrapper DOM node when available.
   */
  const bindViewport = useCallback(
    (viewportEl: HTMLElement | null) => {
      if (!viewportEl || !sendCursor) return () => {}
      const move = (e: PointerEvent) => onPointerMove(e)
      const leave = () => onPointerLeave()
      viewportEl.addEventListener("pointermove", move)
      viewportEl.addEventListener("pointerleave", leave)
      return () => {
        viewportEl.removeEventListener("pointermove", move)
        viewportEl.removeEventListener("pointerleave", leave)
      }
    },
    [onPointerMove, onPointerLeave, sendCursor]
  )

  // Text caret + selection while focused inside the document surface
  useEffect(() => {
    const reportCaret = () => {
      const surface = surfaceRef.current
      if (!surface) return
      const active = document.activeElement
      if (!(active instanceof HTMLElement) || !surface.contains(active)) return

      let caretRect: DOMRect | null = null
      let selRects: DOMRect[] = []

      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
      ) {
        selRects = getTextFieldSelectionClientRects(active)
        caretRect = getTextFieldCaretClientRect(active)
      } else if (
        active.isContentEditable ||
        active.closest("[contenteditable=true]")
      ) {
        selRects = getDomSelectionClientRects()
        caretRect = getDomSelectionCaretClientRect()
      }

      if (selRects.length > 0) {
        const norms = selRects
          .map(clientRectToNorm)
          .filter((r): r is CollabNormRect => r != null)
        if (norms.length === 0) return
        const anchor = caretRect
          ? clientToPaper(caretRect.left, caretRect.top)
          : { x: norms[0]!.x, y: norms[0]!.y }
        if (!anchor) return
        const el = surface
        const srect = el.getBoundingClientRect()
        const scaleY = srect.height / (el.offsetHeight || srect.height)
        const h =
          caretRect && scaleY > 0
            ? caretRect.height / scaleY
            : norms[0]!.h * el.offsetHeight
        sendCursor(anchor.x, anchor.y, "selection", h, norms)
        return
      }

      if (!caretRect) return

      const n = clientToPaper(caretRect.left, caretRect.top)
      if (!n) return
      const el = surface
      const srect = el.getBoundingClientRect()
      const scaleY = srect.height / (el.offsetHeight || srect.height)
      const h = scaleY > 0 ? caretRect.height / scaleY : caretRect.height
      sendCursor(n.x, n.y, "caret", h)
    }

    const onSel = () => {
      requestAnimationFrame(reportCaret)
    }

    document.addEventListener("selectionchange", onSel)
    document.addEventListener("keyup", onSel, true)
    document.addEventListener("pointerup", onSel, true)
    return () => {
      document.removeEventListener("selectionchange", onSel)
      document.removeEventListener("keyup", onSel, true)
      document.removeEventListener("pointerup", onSel, true)
    }
  }, [clientToPaper, clientRectToNorm, sendCursor])

  return {
    surfaceRef,
    surfaceSize,
    onPointerMove,
    onPointerLeave,
    bindViewport,
  }
}
