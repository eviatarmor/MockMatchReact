import type { Language } from "@mockmatch/schemas"

export const LANGUAGE_STORAGE_KEY = "mockmatch-language"

export const SUPPORTED_LANGUAGES = ["en-US", "en-GB", "en-AU"] as const satisfies readonly Language[]

export const DEFAULT_LANGUAGE: Language = "en-AU"

export function isLanguage(value: unknown): value is Language {
  return (
    typeof value === "string" &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  )
}

/** Read preferred language from localStorage (pre-auth / cold start). */
export function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isLanguage(raw) ? raw : null
  } catch {
    return null
  }
}

/** Persist language preference for cold starts. */
export function persistLanguage(language: Language): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // private mode / blocked storage
  }
}
