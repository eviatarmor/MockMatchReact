import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  __getAnalyticsStateForTests,
  __resetAnalyticsForTests,
  applyPrefsToAnalytics,
  disableGa,
  initGa,
  trackEvent,
  trackPageView,
} from "../../src/analytics"
import { createPrefs } from "../../src/prefs-storage"

beforeEach(() => {
  __resetAnalyticsForTests()
  document.head.innerHTML = ""
})

afterEach(() => {
  __resetAnalyticsForTests()
  document.head.innerHTML = ""
})

describe("initGa", () => {
  it("no-ops when measurement id is empty", () => {
    initGa("")
    initGa("   ")
    expect(__getAnalyticsStateForTests().scriptInjected).toBe(false)
    expect(document.querySelectorAll("script").length).toBe(0)
  })

  it("injects gtag script once", () => {
    initGa("G-TEST123")
    initGa("G-TEST123")
    const scripts = document.querySelectorAll(
      'script[src*="googletagmanager.com/gtag/js"]'
    )
    expect(scripts.length).toBe(1)
    expect(scripts[0]?.getAttribute("src")).toContain("G-TEST123")
    expect(__getAnalyticsStateForTests().loadedMeasurementId).toBe("G-TEST123")
  })
})

describe("applyPrefsToAnalytics", () => {
  it("does not load when analytics is false", () => {
    applyPrefsToAnalytics(
      createPrefs({ analytics: false, performance: false }),
      "G-TEST123"
    )
    expect(__getAnalyticsStateForTests().scriptInjected).toBe(false)
    expect(
      (window as unknown as Record<string, boolean>)["ga-disable-G-TEST123"]
    ).toBe(true)
  })

  it("loads when analytics is true", () => {
    applyPrefsToAnalytics(
      createPrefs({ analytics: true, performance: true }),
      "G-TEST123"
    )
    expect(__getAnalyticsStateForTests().scriptInjected).toBe(true)
  })

  it("no-ops without measurement id (notice still independent)", () => {
    applyPrefsToAnalytics(
      createPrefs({ analytics: true, performance: true }),
      undefined
    )
    expect(__getAnalyticsStateForTests().scriptInjected).toBe(false)
  })
})

describe("trackPageView / trackEvent", () => {
  it("no-ops before init", () => {
    expect(() => trackPageView("/docs")).not.toThrow()
    expect(() => trackEvent("click")).not.toThrow()
  })

  it("pushes events after init", () => {
    initGa("G-TEST123")
    const before = window.dataLayer?.length ?? 0
    trackPageView("/docs/getting-started")
    trackEvent("cta", { label: "x" })
    expect((window.dataLayer?.length ?? 0) > before).toBe(true)
  })
})

describe("disableGa", () => {
  it("sets disable flag", () => {
    disableGa("G-TEST123")
    expect(
      (window as unknown as Record<string, boolean>)["ga-disable-G-TEST123"]
    ).toBe(true)
  })
})
