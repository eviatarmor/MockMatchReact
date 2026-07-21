import { useEffect } from "react"

/**
 * Marks the document ready for headless PDF capture once data has loaded.
 * Playwright waits on `html[data-print-ready="true"]`.
 */
export function usePrintReady(ready: boolean) {
  useEffect(() => {
    if (!ready) {
      delete document.documentElement.dataset.printReady
      return
    }

    let cancelled = false

    void (async () => {
      try {
        if (document.fonts?.ready) {
          await document.fonts.ready
        }
      } catch {
        // Fonts API optional — still mark ready.
      }
      if (!cancelled) {
        document.documentElement.dataset.printReady = "true"
      }
    })()

    return () => {
      cancelled = true
      delete document.documentElement.dataset.printReady
    }
  }, [ready])
}
