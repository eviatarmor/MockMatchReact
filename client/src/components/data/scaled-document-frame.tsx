import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/** US Letter page size used by resume / cover-letter print surfaces. */
export const DOCUMENT_PAGE_WIDTH = 816
export const DOCUMENT_PAGE_HEIGHT = 1056

/** Slight overscale so the letter page fills the tile with a mild crop zoom. */
const FIT_PADDING = 1.08

interface ScaledDocumentFrameProps {
  readonly children: ReactNode
  readonly className?: string
}

/**
 * Full-bleed letter-page thumbnail: measures the frame, scales the page to
 * nearly fill width/height, and centers it (no card chrome / gutters).
 */
export function ScaledDocumentFrame({ children, className }: ScaledDocumentFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.25)

  useEffect(() => {
    const el = frameRef.current
    if (!el) return

    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width <= 0 || height <= 0) return
      const next = Math.min(
        (width * FIT_PADDING) / DOCUMENT_PAGE_WIDTH,
        (height * FIT_PADDING) / DOCUMENT_PAGE_HEIGHT
      )
      setScale(next)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={frameRef}
      className={cn("relative h-full w-full overflow-hidden bg-white", className)}
      style={{ aspectRatio: `${DOCUMENT_PAGE_WIDTH} / ${DOCUMENT_PAGE_HEIGHT}` }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 origin-center select-none"
        style={{
          width: DOCUMENT_PAGE_WIDTH,
          height: DOCUMENT_PAGE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
