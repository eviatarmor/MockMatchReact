import { z } from "zod"
import {
  countrySchema,
  dateFormatSchema,
  privacyPreferencesSchema,
  timeFormatSchema,
  userPreferencesSchema,
  voiceProfileSchema,
} from "./preferences.js"

export const updateProfileInputSchema = z.object({
  fullName: z.string().trim().min(1).max(256),
})

/** Partial prefs merge — top-level fields optional; privacy deep-partial. */
export const updatePreferencesInputSchema = z
  .object({
    voiceProfile: voiceProfileSchema.optional(),
    country: countrySchema.optional(),
    dateFormat: dateFormatSchema.optional(),
    timeFormat: timeFormatSchema.optional(),
    privacy: privacyPreferencesSchema.partial().optional(),
  })
  .refine(
    (value) =>
      value.voiceProfile !== undefined ||
      value.country !== undefined ||
      value.dateFormat !== undefined ||
      value.timeFormat !== undefined ||
      value.privacy !== undefined,
    { message: "At least one preference field is required" }
  )

export const accountDtoSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().nullable(),
  preferences: userPreferencesSchema,
})

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesInputSchema>
export type AccountDto = z.infer<typeof accountDtoSchema>
