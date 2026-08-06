import { useEffect, type RefObject } from "react"
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch"

/**
 * After centerOnBoardPoint (template apply), the board plane's top-left can
 * sit *inside* the viewport. The transform wrapper still paints the full
 * grid, but pointer handlers only lived on the 3000² surface — so the
 * top/left grid looked live and did nothing. Forward pointerdown from the
 * wrapper when the event is outside the board plane.
 */
export function useWrapperBoardPointer(opts: {
  viewportApiRef: RefObject<ReactZoomPanPinchRef | null>
  surfaceRef: RefObject<HTMLElement | null>
  isPanTool: () => boolean
  onBoardPointerDown: (e: PointerEvent) => void
  /** Re-bind when tool registry / host identity changes. */
  bindKey: unknown
}) {
  const {
    viewportApiRef,
    surfaceRef,
    isPanTool,
    onBoardPointerDown,
    bindKey,
  } = opts

  useEffect(() => {
    let raf = 0
    let wrapper: HTMLDivElement | null = null

    const onWrapperPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (isPanTool()) return
      const surface = surfaceRef.current
      if (!surface) return
      const target = e.target
      if (!(target instanceof Node)) return
      if (surface.contains(target)) return
      onBoardPointerDown(e)
    }

    const attach = () => {
      wrapper = viewportApiRef.current?.instance?.wrapperComponent ?? null
      if (!wrapper) {
        raf = requestAnimationFrame(attach)
        return
      }
      wrapper.addEventListener("pointerdown", onWrapperPointerDown)
    }
    attach()

    return () => {
      cancelAnimationFrame(raf)
      wrapper?.removeEventListener("pointerdown", onWrapperPointerDown)
    }
  }, [viewportApiRef, surfaceRef, isPanTool, onBoardPointerDown, bindKey])
}
