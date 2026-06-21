import { useCallback, useRef, useState } from "react"
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch"
import { ZOOM } from "../constants"

interface TransformState {
  readonly scale: number
  readonly positionX: number
  readonly positionY: number
}

/**
 * Pan + zoom controller backed by react-zoom-pan-pinch.
 *
 * Owns the library ref + a mirror of its transform state (scale/offset) so
 * consumers can both drive zoom (buttons) and read the live transform (e.g. to
 * sync a background grid). Generic enough to drive any document preview.
 */
export function useCanvasViewport() {
  const ref = useRef<ReactZoomPanPinchRef>(null)
  const [transform, setTransform] = useState<{ scale: number; x: number; y: number }>({
    scale: ZOOM.default,
    x: 0,
    y: 0,
  })

  // react-zoom-pan-pinch writes to the DOM itself (ref + rAF); we only mirror
  // the values we render with, so re-renders stay limited to the grid + label.
  const onTransform = useCallback((_ref: ReactZoomPanPinchRef, state: TransformState) => {
    setTransform({ scale: state.scale, x: state.positionX, y: state.positionY })
  }, [])

  const zoomIn = useCallback(() => ref.current?.zoomIn(), [])
  const zoomOut = useCallback(() => ref.current?.zoomOut(), [])
  const resetView = useCallback(() => ref.current?.resetTransform(), [])

  return {
    ref,
    scale: transform.scale,
    offset: { x: transform.x, y: transform.y },
    zoomPercent: Math.round(transform.scale * 100),
    zoomIn,
    zoomOut,
    resetView,
    canZoomIn: transform.scale < ZOOM.max - 0.001,
    canZoomOut: transform.scale > ZOOM.min + 0.001,
    onTransform,
  }
}
