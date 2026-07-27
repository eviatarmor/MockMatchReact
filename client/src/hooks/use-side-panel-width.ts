import {
  useCallback,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(n)))
}

function readStored(key: string | undefined, fallback: number, min: number, max: number) {
  if (!key) return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const n = Number(raw)
    if (!Number.isFinite(n)) return fallback
    return clamp(n, min, max)
  } catch {
    return fallback
  }
}

/**
 * Pixel width for a right-side panel with left-edge drag resize
 * (drag left → wider). Optional localStorage key shares width across panels.
 */
export function useSidePanelWidth(options: {
  readonly defaultWidth: number
  readonly min: number
  readonly max: number
  /** Persist width so all sidebar tabs share one size. */
  readonly storageKey?: string
}) {
  const { defaultWidth, min, max, storageKey } = options
  const [width, setWidthState] = useState(() =>
    readStored(storageKey, defaultWidth, min, max)
  )
  const [isDragging, setIsDragging] = useState(false)

  const setWidth = useCallback(
    (next: number | ((prev: number) => number)) => {
      setWidthState((prev) => {
        const value = clamp(
          typeof next === "function" ? next(prev) : next,
          min,
          max
        )
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, String(value))
          } catch {
            // ignore
          }
        }
        return value
      })
    },
    [min, max, storageKey]
  )

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault()
      const startX = event.clientX
      const startWidth = width
      const el = event.currentTarget
      el.setPointerCapture(event.pointerId)
      setIsDragging(true)

      const onMove = (e: PointerEvent) => {
        setWidth(startWidth + (startX - e.clientX))
      }
      const onUp = (e: PointerEvent) => {
        setIsDragging(false)
        el.releasePointerCapture(e.pointerId)
        el.removeEventListener("pointermove", onMove)
        el.removeEventListener("pointerup", onUp)
        el.removeEventListener("pointercancel", onUp)
      }

      el.addEventListener("pointermove", onMove)
      el.addEventListener("pointerup", onUp)
      el.addEventListener("pointercancel", onUp)
    },
    [width, setWidth]
  )

  return { width, setWidth, startResize, isDragging }
}
