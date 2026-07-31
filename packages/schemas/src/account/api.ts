import { z } from "zod"
import {
  countrySchema,
  dateFormatSchema,
  languageSchema,
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
    language: languageSchema.optional(),
    country: countrySchema.optional(),
    dateFormat: dateFormatSchema.optional(),
    timeFormat: timeFormatSchema.optional(),
    privacy: privacyPreferencesSchema.partial().optional(),
  })
  .refine(
    (value) =>
      value.voiceProfile !== undefined ||
      value.language !== undefined ||
      value.country !== undefined ||
      value.dateFormat !== undefined ||
      value.timeFormat !== undefined ||
      value.privacy !== undefined,
    { message: "At least one preference field is required" }
  )

export const AVATAR_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export const avatarContentTypeSchema = z.enum(AVATAR_CONTENT_TYPES)

export const requestAvatarUploadInputSchema = z.object({
  contentType: avatarContentTypeSchema,
})

export const confirmAvatarUploadInputSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(512)
    .regex(/^avatars\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpe?g|png|webp)$/i, {
      message: "Invalid avatar object key",
    }),
})

export const requestAvatarUploadResultSchema = z.object({
  uploadUrl: z.string().url(),
  key: z.string().min(1),
  contentType: avatarContentTypeSchema,
})

export const accountDtoSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().nullable(),
  /** Short-lived signed GET URL when a photo is set; null otherwise. */
  avatarUrl: z.string().url().nullable(),
  preferences: userPreferencesSchema,
})

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesInputSchema>
export type RequestAvatarUploadInput = z.infer<
  typeof requestAvatarUploadInputSchema
>
export type ConfirmAvatarUploadInput = z.infer<
  typeof confirmAvatarUploadInputSchema
>
export type RequestAvatarUploadResult = z.infer<
  typeof requestAvatarUploadResultSchema
>
export type AccountDto = z.infer<typeof accountDtoSchema>
