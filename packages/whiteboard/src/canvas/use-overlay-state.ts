import { useCallback, useRef, useState, type ReactNode } from "react"

function applyOverlayEntry(
  next: Record<string, ReactNode>,
  key: string,
  value: ReactNode | null
): boolean {
  if (value == null) {
    if (!(key in next)) return false
    delete next[key]
    return true
  }
  if (next[key] === value) return false
  next[key] = value
  return true
}

/** Coalesce overlay React updates to 1/frame during stroke/marquee. */
export function useOverlayState() {
  const [overlays, setOverlays] = useState<Record<string, ReactNode>>({})
  const overlayPendingRef = useRef<Record<string, ReactNode | null>>({})
  const overlayRafRef = useRef(0)

  const setOverlay = useCallback((key: string, node: ReactNode | null) => {
    overlayPendingRef.current[key] = node
    if (overlayRafRef.current) return
    overlayRafRef.current = requestAnimationFrame(() => {
      overlayRafRef.current = 0
      const pending = overlayPendingRef.current
      overlayPendingRef.current = {}
      setOverlays((prev) => {
        const next = { ...prev }
        let changed = false
        for (const [k, v] of Object.entries(pending)) {
          if (applyOverlayEntry(next, k, v)) changed = true
        }
        return changed ? next : prev
      })
    })
  }, [])

  const clearOverlays = useCallback(() => {
    overlayPendingRef.current = {}
    if (overlayRafRef.current) {
      cancelAnimationFrame(overlayRafRef.current)
      overlayRafRef.current = 0
    }
    setOverlays({})
  }, [])

  return { overlays, setOverlay, clearOverlays }
}
