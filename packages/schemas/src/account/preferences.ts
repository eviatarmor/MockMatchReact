import { z } from "zod"

export const voiceProfileSchema = z.enum([
  "buttery",
  "resonant",
  "mellow",
  "airy",
  "polished",
  "rounded",
])

export const countrySchema = z.enum(["US", "AU", "GB"])

/** UI locale + Harper writing dialect. Independent of country (job market). */
export const languageSchema = z.enum(["en-US", "en-GB", "en-AU"])

export const dateFormatSchema = z.enum([
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY/MM/DD",
])

export const timeFormatSchema = z.enum(["12h", "24h"])

export const privacyPreferencesSchema = z.object({
  allowLocationMetadata: z.boolean(),
  allowImproveApp: z.boolean(),
  marketingEmails: z.boolean(),
  analyticsCookies: z.boolean(),
  performanceCookies: z.boolean(),
})

export const userPreferencesSchema = z.object({
  voiceProfile: voiceProfileSchema,
  /** Default fills missing key on existing JSONB rows. */
  language: languageSchema.default("en-AU"),
  country: countrySchema,
  dateFormat: dateFormatSchema,
  timeFormat: timeFormatSchema,
  privacy: privacyPreferencesSchema,
})

export const DEFAULT_USER_PREFERENCES = {
  voiceProfile: "mellow",
  language: "en-AU",
  country: "US",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  privacy: {
    allowLocationMetadata: true,
    allowImproveApp: true,
    marketingEmails: false,
    analyticsCookies: true,
    performanceCookies: true,
  },
} as const satisfies z.infer<typeof userPreferencesSchema>

export type VoiceProfile = z.infer<typeof voiceProfileSchema>
export type Language = z.infer<typeof languageSchema>
export type Country = z.infer<typeof countrySchema>
export type DateFormat = z.infer<typeof dateFormatSchema>
export type TimeFormat = z.infer<typeof timeFormatSchema>
export type PrivacyPreferences = z.infer<typeof privacyPreferencesSchema>
export type UserPreferences = z.infer<typeof userPreferencesSchema>
