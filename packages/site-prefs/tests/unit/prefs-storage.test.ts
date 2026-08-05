import { afterEach, describe, expect, it } from "vitest"
import {
  buildPrefsCookieString,
  createPrefs,
  hasDecided,
  parsePrefs,
  readPrefs,
  serializePrefs,
  writePrefs,
} from "../../src/prefs-storage"
import { SITE_PREFS_COOKIE_NAME } from "../../src/constants"

afterEach(() => {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0]?.trim()
    if (name) {
      document.cookie = `${name}=; Path=/; Max-Age=0`
    }
  })
})

describe("createPrefs / parsePrefs", () => {
  it("round-trips via serialize", () => {
    const prefs = createPrefs({
      analytics: true,
      performance: false,
      ts: 1_700_000_000_000,
    })
    expect(parsePrefs(serializePrefs(prefs))).toEqual(prefs)
  })

  it("rejects invalid payloads", () => {
    expect(parsePrefs(null)).toBeNull()
    expect(parsePrefs("")).toBeNull()
    expect(parsePrefs("{")).toBeNull()
    expect(parsePrefs(JSON.stringify({ v: 2, analytics: true }))).toBeNull()
    expect(
      parsePrefs(
        JSON.stringify({ v: 1, analytics: "yes", performance: false, ts: 1 })
      )
    ).toBeNull()
  })
})

describe("hasDecided", () => {
  it("is false for null", () => {
    expect(hasDecided(null)).toBe(false)
  })

  it("is true for valid v1 prefs", () => {
    expect(
      hasDecided(createPrefs({ analytics: false, performance: false }))
    ).toBe(true)
  })
})

describe("writePrefs / readPrefs", () => {
  it("stores and reads prefs", () => {
    const prefs = createPrefs({
      analytics: true,
      performance: true,
      ts: 42,
    })
    writePrefs(prefs, { secure: false })
    expect(readPrefs()).toEqual(prefs)
  })

  it("buildPrefsCookieString includes domain when set", () => {
    const prefs = createPrefs({ analytics: false, performance: false })
    const raw = buildPrefsCookieString(prefs, {
      cookieDomain: ".mockmatch.app",
      secure: true,
    })
    expect(raw).toContain(`${SITE_PREFS_COOKIE_NAME}=`)
    expect(raw).toContain("Domain=.mockmatch.app")
    expect(raw).toContain("SameSite=Lax")
    expect(raw).toContain("Secure")
    expect(raw).toContain("Path=/")
  })

  it("buildPrefsCookieString omits Domain when not set", () => {
    const prefs = createPrefs({ analytics: true, performance: false })
    const raw = buildPrefsCookieString(prefs, { secure: false })
    expect(raw).not.toContain("Domain=")
    expect(raw).not.toContain("Secure")
  })
})
