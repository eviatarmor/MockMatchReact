import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react"
import { ZOOM } from "../constants"

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

interface Offset {
  readonly x: number
  readonly y: number
}

/**
 * Pan + zoom controller for a transformable canvas.
 *
 * Returns the current scale/offset plus event-handler props to spread onto the
 * scrollable container. Generic enough to drive any document preview, not just
 * the cover-letter page — the consumer owns the transformed child.
 */
export function useCanvasViewport() {
  const [scale, setScale] = useState<number>(ZOOM.default)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const panOrigin = useRef<{ pointerX: number; pointerY: number; offsetX: number; offsetY: number } | null>(null)

  const applyZoom = useCallback((nextScale: number, pivotX?: number, pivotY?: number) => {
    setScale((prevScale) => {
      const clamped = clamp(Number(nextScale.toFixed(2)), ZOOM.min, ZOOM.max)
      if (clamped === prevScale) return prevScale
      const rect = containerRef.current?.getBoundingClientRect()
      const px = pivotX ?? (rect ? rect.width / 2 : 0)
      const py = pivotY ?? (rect ? rect.height / 2 : 0)
      const ratio = clamped / prevScale
      // Keep the pivot point visually fixed while scaling.
      setOffset((prev) => ({
        x: px - (px - prev.x) * ratio,
        y: py - (py - prev.y) * ratio,
      }))
      return clamped
    })
  }, [])

  const zoomIn = useCallback(() => applyZoom(scale + ZOOM.step), [applyZoom, scale])
  const zoomOut = useCallback(() => applyZoom(scale - ZOOM.step), [applyZoom, scale])
  const setZoom = useCallback((value: number) => applyZoom(value), [applyZoom])

  const resetView = useCallback(() => {
    setScale(ZOOM.default)
    setOffset({ x: 0, y: 0 })
  }, [])

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      const rect = containerRef.current?.getBoundingClientRect()
      const pivotX = rect ? event.clientX - rect.left : undefined
      const pivotY = rect ? event.clientY - rect.top : undefined
      const factor = event.deltaY < 0 ? 1 + ZOOM.step : 1 - ZOOM.step
      applyZoom(scale * factor, pivotX, pivotY)
      return
    }
    // Plain scroll pans the canvas (shift swaps axes, matching native behaviour).
    setOffset((prev) =>
      event.shiftKey
        ? { x: prev.x - event.deltaY, y: prev.y - event.deltaX }
        : { x: prev.x - event.deltaX, y: prev.y - event.deltaY }
    )
  }, [applyZoom, scale])

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    // Only background drags pan; let interactive children handle their own clicks.
    if (event.button !== 0 && event.button !== 1) return
    if (event.target !== event.currentTarget) return
    setIsPanning(true)
    panOrigin.current = { pointerX: event.clientX, pointerY: event.clientY, offsetX: offset.x, offsetY: offset.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [offset.x, offset.y])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = panOrigin.current
    if (!origin) return
    setOffset({
      x: origin.offsetX + (event.clientX - origin.pointerX),
      y: origin.offsetY + (event.clientY - origin.pointerY),
    })
  }, [])

  const endPan = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panOrigin.current) return
    panOrigin.current = null
    setIsPanning(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  return {
    scale,
    offset,
    isPanning,
    zoomPercent: Math.round(scale * 100),
    zoomIn,
    zoomOut,
    setZoom,
    resetView,
    canZoomIn: scale < ZOOM.max,
    canZoomOut: scale > ZOOM.min,
    containerRef,
    containerProps: {
      onWheel: handleWheel,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: endPan,
      onPointerLeave: endPan,
    },
  }
}
