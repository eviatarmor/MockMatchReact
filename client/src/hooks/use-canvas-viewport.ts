import { useCallback, useEffect, useRef, useState } from "react"
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch"

/** Zoom bounds + step for the canvas viewport (1 = 100%). */
export const ZOOM = {
  min: 0.4,
  max: 2.5,
  step: 0.1,
  default: 1,
} as const

/** Dot grid cell size at scale 1 (matches canvas background pattern). */
const GRID_DOT = 24

interface TransformState {
  readonly scale: number
  readonly positionX: number
  readonly positionY: number
}

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
 * Pan + zoom controller backed by react-zoom-pan-pinch.
 *
 * Pan position is kept in a ref and painted onto the grid layer via DOM styles.
 * React state only updates when **scale** changes (toolbar % + DnD scale modifier).
 *
 * Previously every pan frame called setState → re-rendered TransformWrapper + the
 * full document → forced reflow / "Maximum update depth exceeded" during pan.
 */
export function useCanvasViewport() {
  const ref = useRef<ReactZoomPanPinchRef>(null)
  const transformRef = useRef<MirrorTransform>({
    scale: ZOOM.default,
    x: 0,
    y: 0,
  })
  /** Wrapper element that owns the radial-dot background. */
  const gridLayerRef = useRef<HTMLElement | null>(null)
  const [scale, setScale] = useState<number>(ZOOM.default)

  const bindGridLayer = useCallback((el: HTMLElement | null) => {
    gridLayerRef.current = el
    if (el) applyGridStyles(el, transformRef.current)
  }, [])

  // react-zoom-pan-pinch writes transform to the content DOM itself; we only
  // mirror pan into the grid CSS and scale into React when it actually changes.
  const onTransform = useCallback(
    (_api: ReactZoomPanPinchRef, state: TransformState) => {
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
    },
    []
  )

  const zoomIn = useCallback(() => ref.current?.zoomIn(), [])
  const zoomOut = useCallback(() => ref.current?.zoomOut(), [])

  /**
   * Fit to 100% and pin the document to the **top-center** of the viewport.
   * Library `resetTransform` / `centerOnInit` centers vertically, which for a
   * tall multi-page paper lands near the middle/bottom — feels like “jump to end”.
   */
  const resetView = useCallback(() => {
    const api = ref.current
    if (!api) return
    const wrapper = api.instance.wrapperComponent
    const content = api.instance.contentComponent
    const nextScale = ZOOM.default

    if (!wrapper || !content) {
      api.setTransform(0, 0, nextScale, 200)
      return
    }

    const wrapperW = wrapper.clientWidth
    const contentW = content.offsetWidth * nextScale
    // Horizontal center, vertical top with small padding (matches canvas pt-12 feel)
    const x = (wrapperW - contentW) / 2
    const y = 48
    api.setTransform(x, y, nextScale, 200)
  }, [])

  // Fixed-step, cursor-anchored wheel zoom. react-zoom-pan-pinch's built-in
  // wheel scales by raw deltaY magnitude, which overshoots wildly on trackpads
  // and hi-res mice; here one wheel event = one ZOOM.step, direction only.
  //
  // Attached as a NON-passive native listener (React's synthetic onWheel is
  // passive, so preventDefault there is ignored and the page still scrolls).
  useEffect(() => {
    let raf = 0
    let wrapper: HTMLDivElement | null = null

    const onWheel = (e: WheelEvent) => {
      const api = ref.current
      if (!api) return
      e.preventDefault()

      if (e.deltaY < 0) api.zoomIn(ZOOM.step, 120)
      else api.zoomOut(ZOOM.step, 120)
    }

    // wrapperComponent mounts after the first paint — wait for it via rAF.
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
    /** Live zoom factor — updates only when scale changes, not on pan. */
    scale,
    /**
     * Latest transform (including pan). Prefer for one-off reads; do not put
     * `offset` in React render props or pan will re-render the document again.
     */
    transformRef,
    zoomPercent: Math.round(scale * 100),
    zoomIn,
    zoomOut,
    resetView,
    canZoomIn: scale < ZOOM.max - 0.001,
    canZoomOut: scale > ZOOM.min + 0.001,
    onTransform,
    bindGridLayer,
  }
}
