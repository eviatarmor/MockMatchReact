import { afterEach, describe, expect, it } from "vitest"
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isLanguage,
  persistLanguage,
  readStoredLanguage,
  SUPPORTED_LANGUAGES,
} from "@/lib/i18n/language"

describe("isLanguage", () => {
  it("accepts supported locales only", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(isLanguage(lang)).toBe(true)
    }
    expect(isLanguage("en-FR")).toBe(false)
    expect(isLanguage("en")).toBe(false)
    expect(isLanguage(null)).toBe(false)
    expect(isLanguage(1)).toBe(false)
  })
})

describe("readStoredLanguage / persistLanguage", () => {
  afterEach(() => {
    window.localStorage.removeItem(LANGUAGE_STORAGE_KEY)
  })

  it("returns null when storage empty or invalid", () => {
    expect(readStoredLanguage()).toBeNull()
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "nope")
    expect(readStoredLanguage()).toBeNull()
  })

  it("round-trips a supported language", () => {
    persistLanguage("en-GB")
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en-GB")
    expect(readStoredLanguage()).toBe("en-GB")
  })

  it("exports expected default", () => {
    expect(DEFAULT_LANGUAGE).toBe("en-AU")
  })
})
