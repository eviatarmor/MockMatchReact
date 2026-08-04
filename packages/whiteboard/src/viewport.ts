import { useCallback, useEffect, useRef, useState } from "react"
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch"

export const WHITEBOARD_ZOOM = {
  min: 0.25,
  max: 2.5,
  step: 0.1,
  default: 1,
} as const

const GRID_DOT = 24

type MirrorTransform = {
  scale: number
  x: number
  y: number
}

function applyGridStyles(el: HTMLElement, t: MirrorTransform) {
  el.style.backgroundSize = `${GRID_DOT * t.scale}px ${GRID_DOT * t.scale}px`
  el.style.backgroundPosition = `${t.x}px ${t.y}px`
}

/**
 * Pan + zoom controller for the whiteboard canvas.
 * Mirrors resume-editor `useCanvasViewport` (scale in React; pan on grid DOM).
 */
export function useWhiteboardViewport() {
  const ref = useRef<ReactZoomPanPinchRef>(null)
  const transformRef = useRef<MirrorTransform>({
    scale: WHITEBOARD_ZOOM.default,
    x: 0,
    y: 0,
  })
  const gridLayerRef = useRef<HTMLElement | null>(null)
  const transformListenersRef = useRef(new Set<() => void>())
  const notifyRafRef = useRef(0)
  const [scale, setScale] = useState<number>(WHITEBOARD_ZOOM.default)

  const bindGridLayer = useCallback((el: HTMLElement | null) => {
    gridLayerRef.current = el
    if (el) applyGridStyles(el, transformRef.current)
  }, [])

  /** Subscribe to pan/zoom without forcing React re-renders of the board. */
  const subscribeTransform = useCallback((listener: () => void) => {
    transformListenersRef.current.add(listener)
    return () => {
      transformListenersRef.current.delete(listener)
    }
  }, [])

  const onTransform = useCallback(
    (
      _api: ReactZoomPanPinchRef,
      state: { scale: number; positionX: number; positionY: number }
    ) => {
      const next: MirrorTransform = {
        scale: state.scale,
        x: state.positionX,
        y: state.positionY,
      }
      transformRef.current = next
      const grid = gridLayerRef.current
      if (grid) applyGridStyles(grid, next)
      setScale((prev) =>
        Math.abs(prev - next.scale) < 1e-6 ? prev : next.scale
      )
      // rAF-coalesce listener fan-out (minimap view-rect, etc.)
      if (notifyRafRef.current) return
      notifyRafRef.current = requestAnimationFrame(() => {
        notifyRafRef.current = 0
        for (const fn of transformListenersRef.current) fn()
      })
    },
    []
  )

  const zoomIn = useCallback(
    () => ref.current?.zoomIn(WHITEBOARD_ZOOM.step, 120),
    []
  )
  const zoomOut = useCallback(
    () => ref.current?.zoomOut(WHITEBOARD_ZOOM.step, 120),
    []
  )
  const resetView = useCallback(() => {
    const api = ref.current
    if (!api) return
    const wrapper = api.instance.wrapperComponent
    const content = api.instance.contentComponent
    if (!wrapper || !content) {
      api.setTransform(0, 0, WHITEBOARD_ZOOM.default, 200)
      return
    }
    // Center the large board plane under the viewport
    const nextScale = WHITEBOARD_ZOOM.default
    const x = (wrapper.clientWidth - content.offsetWidth * nextScale) / 2
    const y = (wrapper.clientHeight - content.offsetHeight * nextScale) / 2
    api.setTransform(x, y, nextScale, 200)
  }, [])

  /**
   * Pan so board-space point (bx, by) sits near the viewport center at current scale.
   */
  const centerOnBoardPoint = useCallback((bx: number, by: number) => {
    const api = ref.current
    if (!api) return
    const wrapper = api.instance.wrapperComponent
    if (!wrapper) return
    const s = transformRef.current.scale || WHITEBOARD_ZOOM.default
    const x = wrapper.clientWidth / 2 - bx * s
    const y = wrapper.clientHeight / 2 - by * s
    api.setTransform(x, y, s, 200)
  }, [])

  // Fixed-step wheel zoom (non-passive) — same as resume canvas
  useEffect(() => {
    let raf = 0
    let wrapper: HTMLDivElement | null = null

    const onWheel = (e: WheelEvent) => {
      const api = ref.current
      if (!api) return
      e.preventDefault()
      if (e.deltaY < 0) api.zoomIn(WHITEBOARD_ZOOM.step, 120)
      else api.zoomOut(WHITEBOARD_ZOOM.step, 120)
    }

    const attach = () => {
      wrapper = ref.current?.instance.wrapperComponent ?? null
      if (wrapper) {
        wrapper.addEventListener("wheel", onWheel, { passive: false })
        bindGridLayer(wrapper)
      } else {
        raf = requestAnimationFrame(attach)
      }
    }
    attach()

    return () => {
      cancelAnimationFrame(raf)
      wrapper?.removeEventListener("wheel", onWheel)
      if (gridLayerRef.current === wrapper) bindGridLayer(null)
    }
  }, [bindGridLayer])

  return {
    ref,
    scale,
    transformRef,
    zoomPercent: Math.round(scale * 100),
    zoomIn,
    zoomOut,
    resetView,
    centerOnBoardPoint,
    subscribeTransform,
    canZoomIn: scale < WHITEBOARD_ZOOM.max - 0.001,
    canZoomOut: scale > WHITEBOARD_ZOOM.min + 0.001,
    onTransform,
    bindGridLayer,
  }
}

export type WhiteboardViewport = ReturnType<typeof useWhiteboardViewport>
