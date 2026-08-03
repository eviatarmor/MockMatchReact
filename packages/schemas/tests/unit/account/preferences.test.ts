import { describe, expect, it } from "vitest"
import {
  DEFAULT_USER_PREFERENCES,
  countrySchema,
  dateFormatSchema,
  languageSchema,
  privacyPreferencesSchema,
  timeFormatSchema,
  userPreferencesSchema,
  voiceProfileSchema,
} from "@/account/preferences.js"

describe("voiceProfileSchema", () => {
  it("accepts known profiles", () => {
    for (const v of [
      "buttery",
      "resonant",
      "mellow",
      "airy",
      "polished",
      "rounded",
    ] as const) {
      expect(voiceProfileSchema.parse(v)).toBe(v)
    }
  })

  it("rejects unknown", () => {
    expect(() => voiceProfileSchema.parse("robot")).toThrow()
  })
})

describe("countrySchema / languageSchema", () => {
  it("accepts market countries", () => {
    expect(countrySchema.parse("US")).toBe("US")
    expect(countrySchema.parse("AU")).toBe("AU")
    expect(countrySchema.parse("GB")).toBe("GB")
    expect(() => countrySchema.parse("DE")).toThrow()
  })

  it("accepts UI locales", () => {
    expect(languageSchema.parse("en-US")).toBe("en-US")
    expect(languageSchema.parse("en-GB")).toBe("en-GB")
    expect(languageSchema.parse("en-AU")).toBe("en-AU")
    expect(() => languageSchema.parse("en")).toThrow()
  })
})

describe("dateFormatSchema / timeFormatSchema", () => {
  it("accepts known formats", () => {
    expect(dateFormatSchema.parse("DD/MM/YYYY")).toBe("DD/MM/YYYY")
    expect(dateFormatSchema.parse("MM/DD/YYYY")).toBe("MM/DD/YYYY")
    expect(dateFormatSchema.parse("YYYY/MM/DD")).toBe("YYYY/MM/DD")
    expect(timeFormatSchema.parse("12h")).toBe("12h")
    expect(timeFormatSchema.parse("24h")).toBe("24h")
  })

  it("rejects invalid", () => {
    expect(() => dateFormatSchema.parse("YYYY-MM-DD")).toThrow()
    expect(() => timeFormatSchema.parse("am/pm")).toThrow()
  })
})

describe("privacyPreferencesSchema", () => {
  const full = {
    allowLocationMetadata: true,
    allowImproveApp: false,
    marketingEmails: false,
    analyticsCookies: true,
    performanceCookies: true,
  }

  it("requires all flags", () => {
    expect(privacyPreferencesSchema.parse(full)).toEqual(full)
    expect(() =>
      privacyPreferencesSchema.parse({ allowLocationMetadata: true })
    ).toThrow()
  })
})

describe("userPreferencesSchema", () => {
  it("parses complete prefs", () => {
    const v = userPreferencesSchema.parse(DEFAULT_USER_PREFERENCES)
    expect(v.voiceProfile).toBe("mellow")
    expect(v.language).toBe("en-AU")
    expect(v.country).toBe("US")
    expect(v.privacy.marketingEmails).toBe(false)
  })

  it("defaults language when omitted", () => {
    const { language: _l, ...withoutLang } = DEFAULT_USER_PREFERENCES
    const v = userPreferencesSchema.parse(withoutLang)
    expect(v.language).toBe("en-AU")
  })

  it("rejects incomplete privacy", () => {
    expect(() =>
      userPreferencesSchema.parse({
        ...DEFAULT_USER_PREFERENCES,
        privacy: { marketingEmails: true },
      })
    ).toThrow()
  })
})

describe("DEFAULT_USER_PREFERENCES", () => {
  it("satisfies schema", () => {
    expect(() => userPreferencesSchema.parse(DEFAULT_USER_PREFERENCES)).not.toThrow()
  })
})
