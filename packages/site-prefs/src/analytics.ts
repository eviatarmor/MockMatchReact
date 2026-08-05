import type { SitePrefs } from "./types"

type GtagFn = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: GtagFn
  }
}

let loadedMeasurementId: string | null = null
let scriptInjected = false

function gtag(...args: unknown[]): void {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(args)
}

function setGaDisabled(measurementId: string, disabled: boolean): void {
  if (typeof window === "undefined") return
  ;(window as unknown as Record<string, boolean>)[`ga-disable-${measurementId}`] =
    disabled
}

/**
 * Load gtag.js once for the given measurement id.
 * Safe to call repeatedly; no-ops when id is empty (site notice still works).
 */
export function initGa(measurementId: string): void {
  const id = measurementId.trim()
  if (!id || typeof document === "undefined" || typeof window === "undefined") {
    return
  }

  setGaDisabled(id, false)

  if (scriptInjected && loadedMeasurementId === id) {
    return
  }

  window.dataLayer = window.dataLayer ?? []
  window.gtag = window.gtag ?? gtag

  if (!scriptInjected) {
    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    document.head.appendChild(script)
    scriptInjected = true
  }

  loadedMeasurementId = id
  window.gtag("js", new Date())
  window.gtag("config", id, { send_page_view: false })
}

export function disableGa(measurementId: string): void {
  const id = measurementId.trim()
  if (!id) return
  setGaDisabled(id, true)
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined" || !window.gtag || !loadedMeasurementId) {
    return
  }
  window.gtag("event", "page_view", {
    page_path: path,
    send_to: loadedMeasurementId,
  })
}

export function trackEvent(
  name: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || !window.gtag || !loadedMeasurementId) {
    return
  }
  window.gtag("event", name, {
    ...params,
    send_to: loadedMeasurementId,
  })
}

/**
 * Apply stored prefs to GA (init or disable).
 * No-ops entirely when measurementId is missing — UI is independent of GA.
 */
export function applyPrefsToAnalytics(
  prefs: SitePrefs | null,
  measurementId?: string
): void {
  const id = measurementId?.trim()
  if (!id) return

  if (prefs?.analytics) {
    initGa(id)
  } else {
    disableGa(id)
  }
}

/** Test-only: reset module load state. */
export function __resetAnalyticsForTests(): void {
  loadedMeasurementId = null
  scriptInjected = false
  if (typeof window !== "undefined") {
    delete window.gtag
    delete window.dataLayer
  }
}

export function __getAnalyticsStateForTests(): {
  loadedMeasurementId: string | null
  scriptInjected: boolean
} {
  return { loadedMeasurementId, scriptInjected }
}
