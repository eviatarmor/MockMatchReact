import {
  DEFAULT_PREFS_MAX_AGE_SECONDS,
  SITE_PREFS_COOKIE_NAME,
  SITE_PREFS_VERSION,
} from "./constants"
import type { SitePrefs, SitePrefsStorageOptions } from "./types"

export function createPrefs(input: {
  analytics: boolean
  performance: boolean
  ts?: number
}): SitePrefs {
  return {
    v: SITE_PREFS_VERSION,
    analytics: input.analytics,
    performance: input.performance,
    ts: input.ts ?? Date.now(),
  }
}

export function hasDecided(prefs: SitePrefs | null | undefined): boolean {
  return Boolean(prefs && prefs.v === SITE_PREFS_VERSION)
}

/** Parse a JSON prefs string. Returns null if missing or invalid. */
export function parsePrefs(raw: string | null | undefined): SitePrefs | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<SitePrefs>
    if (data.v !== SITE_PREFS_VERSION) return null
    if (typeof data.analytics !== "boolean") return null
    if (typeof data.performance !== "boolean") return null
    if (typeof data.ts !== "number" || !Number.isFinite(data.ts)) return null
    return {
      v: SITE_PREFS_VERSION,
      analytics: data.analytics,
      performance: data.performance,
      ts: data.ts,
    }
  } catch {
    return null
  }
}

export function serializePrefs(prefs: SitePrefs): string {
  return JSON.stringify(prefs)
}

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null
  const prefix = `${name}=`
  const parts = document.cookie.split("; ")
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length))
    }
  }
  return null
}

export function readPrefs(
  cookieName: string = SITE_PREFS_COOKIE_NAME
): SitePrefs | null {
  return parsePrefs(readCookieValue(cookieName))
}

export function writePrefs(
  prefs: SitePrefs,
  options: SitePrefsStorageOptions = {},
  cookieName: string = SITE_PREFS_COOKIE_NAME
): void {
  if (typeof document === "undefined") return

  const maxAge = options.maxAgeSeconds ?? DEFAULT_PREFS_MAX_AGE_SECONDS
  const secure =
    options.secure ??
    (typeof location !== "undefined" && location.protocol === "https:")

  const segments = [
    `${cookieName}=${encodeURIComponent(serializePrefs(prefs))}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ]

  if (options.cookieDomain) {
    segments.push(`Domain=${options.cookieDomain}`)
  }
  if (secure) {
    segments.push("Secure")
  }

  document.cookie = segments.join("; ")
}

/** Build the cookie assignment string (test helper / inspection). */
export function buildPrefsCookieString(
  prefs: SitePrefs,
  options: SitePrefsStorageOptions = {},
  cookieName: string = SITE_PREFS_COOKIE_NAME
): string {
  const maxAge = options.maxAgeSeconds ?? DEFAULT_PREFS_MAX_AGE_SECONDS
  const segments = [
    `${cookieName}=${encodeURIComponent(serializePrefs(prefs))}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ]
  if (options.cookieDomain) {
    segments.push(`Domain=${options.cookieDomain}`)
  }
  if (options.secure) {
    segments.push("Secure")
  }
  return segments.join("; ")
}
