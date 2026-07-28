import {
  useCallback,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(n)))
}

function readStored(
  key: string | undefined,
  fallback: number,
  min: number,
  max: number
) {
  if (!key || typeof localStorage === "undefined") return fallback
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

/** Pixel height for a bottom panel (drag up → taller). */
export function useBottomPanelHeight(options: {
  readonly defaultHeight: number
  readonly min: number
  readonly max: number
  readonly storageKey?: string
}) {
  const { defaultHeight, min, max, storageKey } = options
  const [height, setHeightState] = useState(() =>
    readStored(storageKey, defaultHeight, min, max)
  )
  const [isDragging, setIsDragging] = useState(false)

  const setHeight = useCallback(
    (next: number | ((prev: number) => number)) => {
      setHeightState((prev) => {
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
      const startY = event.clientY
      const startHeight = height
      const el = event.currentTarget
      el.setPointerCapture(event.pointerId)
      setIsDragging(true)

      const onMove = (e: PointerEvent) => {
        // Drag up increases height
        setHeight(startHeight + (startY - e.clientY))
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
    [height, setHeight]
  )

  return { height, setHeight, startResize, isDragging }
}
