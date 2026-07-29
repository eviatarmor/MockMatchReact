import { useCallback, useEffect, useRef, useState } from "react"
import {
  getDomSelectionCaretClientRect,
  getDomSelectionClientRects,
  getTextFieldCaretClientRect,
  getTextFieldSelectionClientRects,
} from "./caret-coords"
import type {
  CollabCursorKind,
  CollabMonacoSel,
  CollabNormRect,
} from "./types"

export type SendCursorMeta = {
  path?: string
  sel?: CollabMonacoSel
}

export type SendCursor = (
  x: number,
  y: number,
  kind?: CollabCursorKind,
  h?: number,
  rects?: CollabNormRect[],
  meta?: SendCursorMeta
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
  const clampRef = useRef(clamp)
  clampRef.current = clamp
  const sendCursorRef = useRef(sendCursor)
  sendCursorRef.current = sendCursor

  useEffect(() => {
    const el = surfaceRef.current
    if (!el) return
    // Always use offsetWidth/Height (layout border-box). contentRect can differ
    // slightly and desync paper Y from clientToPaper (which uses border-box).
    const measure = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (w > 0 && h > 0) setSurfaceSize({ w, h })
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [])

  const clientToPaper = useCallback((clientX: number, clientY: number) => {
    const el = surfaceRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    let x = (clientX - rect.left) / rect.width
    let y = (clientY - rect.top) / rect.height
    if (clampRef.current) {
      x = Math.min(1, Math.max(0, x))
      y = Math.min(1, Math.max(0, y))
    }
    return { x, y }
  }, [])

  /** Client DOMRect → normalized paper rect (x/y/w/h fractions of paper). */
  const clientRectToNorm = useCallback((r: DOMRect): CollabNormRect | null => {
    const el = surfaceRef.current
    if (!el) return null
    const srect = el.getBoundingClientRect()
    if (srect.width <= 0 || srect.height <= 0) return null
    const layoutW = el.offsetWidth || 1
    const layoutH = el.offsetHeight || 1
    // Convert client → layout via the same scale clientToPaper uses
    const scaleX = srect.width / layoutW
    const scaleY = srect.height / layoutH
    if (scaleX <= 0 || scaleY <= 0) return null
    return {
      x: (r.left - srect.left) / srect.width,
      y: (r.top - srect.top) / srect.height,
      w: Math.max(0, r.width / srect.width),
      h: Math.max(0, r.height / srect.height),
    }
  }, [])

  /**
   * Client caret rect → paper x/y (0–1) + height in **layout** px
   * (RemoteCursors sits under the same CSS transform as the paper).
   *
   * Identity: layoutY = (clientY - srect.top) * (offsetHeight / srect.height)
   *         = yNorm * offsetHeight  when surfaceSize.h === offsetHeight.
   */
  const clientCaretToPaper = useCallback((r: DOMRect) => {
    const el = surfaceRef.current
    if (!el) return null
    const srect = el.getBoundingClientRect()
    if (srect.width <= 0 || srect.height <= 0) return null
    const layoutH = el.offsetHeight || 1
    let x = (r.left - srect.left) / srect.width
    let y = (r.top - srect.top) / srect.height
    if (clampRef.current) {
      x = Math.min(1, Math.max(0, x))
      y = Math.min(1, Math.max(0, y))
    }
    // height: client → layout
    const h = r.height * (layoutH / srect.height)
    return { x, y, h }
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
      sendCursorRef.current(n.x, n.y, "pointer")
    },
    [clientToPaper]
  )

  const onPointerLeave = useCallback(() => {
    clearCursor?.()
  }, [clearCursor])

  const bindViewport = useCallback(
    (viewportEl: HTMLElement | null) => {
      if (!viewportEl) return () => {}
      const move = (e: PointerEvent) => onPointerMove(e)
      const leave = () => onPointerLeave()
      viewportEl.addEventListener("pointermove", move)
      viewportEl.addEventListener("pointerleave", leave)
      return () => {
        viewportEl.removeEventListener("pointermove", move)
        viewportEl.removeEventListener("pointerleave", leave)
      }
    },
    [onPointerMove, onPointerLeave]
  )

  // Text caret + selection while focused inside the document surface
  useEffect(() => {
    let raf = 0

    const reportCaret = () => {
      const surface = surfaceRef.current
      if (!surface) return
      const active = document.activeElement
      if (!(active instanceof HTMLElement) || !surface.contains(active)) return

      let caretRect: DOMRect | null = null
      let selRects: DOMRect[] = []

      try {
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
      } catch {
        // Measurement must never break editing
        return
      }

      if (selRects.length > 0) {
        const norms = selRects
          .map(clientRectToNorm)
          .filter((r): r is CollabNormRect => r != null)
        if (norms.length === 0) return
        const anchorRect = caretRect ?? selRects[selRects.length - 1]!
        const paper = clientCaretToPaper(anchorRect)
        if (!paper) return
        sendCursorRef.current(
          paper.x,
          paper.y,
          "selection",
          paper.h,
          norms
        )
        return
      }

      if (!caretRect) return
      const paper = clientCaretToPaper(caretRect)
      if (!paper) return
      sendCursorRef.current(paper.x, paper.y, "caret", paper.h)
    }

    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        reportCaret()
      })
    }

    // Do **not** listen on keydown — measuring mid-key can race Lexical.
    // selectionchange + input cover caret moves while typing.
    document.addEventListener("selectionchange", schedule)
    document.addEventListener("keyup", schedule, true)
    document.addEventListener("pointerup", schedule, true)
    document.addEventListener("input", schedule, true)
    document.addEventListener("select", schedule, true)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      document.removeEventListener("selectionchange", schedule)
      document.removeEventListener("keyup", schedule, true)
      document.removeEventListener("pointerup", schedule, true)
      document.removeEventListener("input", schedule, true)
      document.removeEventListener("select", schedule, true)
    }
  }, [clientRectToNorm, clientCaretToPaper])

  return {
    surfaceRef,
    surfaceSize,
    onPointerMove,
    onPointerLeave,
    bindViewport,
  }
}
