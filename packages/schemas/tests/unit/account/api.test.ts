import { describe, expect, it } from "vitest"
import { DEFAULT_USER_PREFERENCES } from "@/account/preferences.js"
import {
  accountDtoSchema,
  avatarContentTypeSchema,
  confirmAvatarUploadInputSchema,
  requestAvatarUploadInputSchema,
  requestAvatarUploadResultSchema,
  updatePreferencesInputSchema,
  updateProfileInputSchema,
} from "@/account/api.js"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("updateProfileInputSchema", () => {
  it("trims and accepts name", () => {
    expect(updateProfileInputSchema.parse({ fullName: "  Ada  " }).fullName).toBe(
      "Ada"
    )
  })

  it("rejects empty / too long", () => {
    expect(() => updateProfileInputSchema.parse({ fullName: "   " })).toThrow()
    expect(() =>
      updateProfileInputSchema.parse({ fullName: "x".repeat(257) })
    ).toThrow()
  })
})

describe("updatePreferencesInputSchema", () => {
  it("requires at least one field", () => {
    expect(() => updatePreferencesInputSchema.parse({})).toThrow()
  })

  it("accepts partial top-level", () => {
    const v = updatePreferencesInputSchema.parse({ country: "GB" })
    expect(v.country).toBe("GB")
  })

  it("accepts deep-partial privacy", () => {
    const v = updatePreferencesInputSchema.parse({
      privacy: { marketingEmails: true },
    })
    expect(v.privacy?.marketingEmails).toBe(true)
  })

  it("rejects invalid enum", () => {
    expect(() =>
      updatePreferencesInputSchema.parse({ voiceProfile: "loud" })
    ).toThrow()
  })
})

describe("avatar schemas", () => {
  it("allows jpeg/png/webp only", () => {
    expect(avatarContentTypeSchema.parse("image/jpeg")).toBe("image/jpeg")
    expect(avatarContentTypeSchema.parse("image/png")).toBe("image/png")
    expect(avatarContentTypeSchema.parse("image/webp")).toBe("image/webp")
    expect(() => avatarContentTypeSchema.parse("image/gif")).toThrow()
  })

  it("requestAvatarUploadInputSchema", () => {
    expect(
      requestAvatarUploadInputSchema.parse({ contentType: "image/png" })
        .contentType
    ).toBe("image/png")
  })

  it("confirmAvatarUploadInputSchema validates key pattern", () => {
    const key = `avatars/${UUID}/${UUID}.png`
    expect(confirmAvatarUploadInputSchema.parse({ key }).key).toBe(key)

    expect(() =>
      confirmAvatarUploadInputSchema.parse({ key: "avatars/x/y.jpg" })
    ).toThrow()
    expect(() =>
      confirmAvatarUploadInputSchema.parse({
        key: `avatars/${UUID}/${UUID}.gif`,
      })
    ).toThrow()
  })

  it("requestAvatarUploadResultSchema needs url", () => {
    const ok = requestAvatarUploadResultSchema.parse({
      uploadUrl: "https://s3.example/put",
      key: "avatars/a",
      contentType: "image/jpeg",
    })
    expect(ok.uploadUrl).toContain("https://")
    expect(() =>
      requestAvatarUploadResultSchema.parse({
        uploadUrl: "not-a-url",
        key: "k",
        contentType: "image/jpeg",
      })
    ).toThrow()
  })
})

describe("accountDtoSchema", () => {
  it("parses full account", () => {
    const dto = accountDtoSchema.parse({
      id: UUID,
      email: "ada@example.com",
      fullName: "Ada",
      avatarUrl: null,
      preferences: DEFAULT_USER_PREFERENCES,
    })
    expect(dto.email).toBe("ada@example.com")
    expect(dto.avatarUrl).toBeNull()
  })

  it("allows avatarUrl as signed GET url", () => {
    const dto = accountDtoSchema.parse({
      id: UUID,
      email: "a@b.co",
      fullName: null,
      avatarUrl: "https://cdn.example/a.jpg?sig=1",
      preferences: DEFAULT_USER_PREFERENCES,
    })
    expect(dto.avatarUrl).toContain("cdn.example")
  })

  it("rejects bad email / id", () => {
    expect(() =>
      accountDtoSchema.parse({
        id: "nope",
        email: "ada@example.com",
        fullName: null,
        avatarUrl: null,
        preferences: DEFAULT_USER_PREFERENCES,
      })
    ).toThrow()
    expect(() =>
      accountDtoSchema.parse({
        id: UUID,
        email: "not-email",
        fullName: null,
        avatarUrl: null,
        preferences: DEFAULT_USER_PREFERENCES,
      })
    ).toThrow()
  })
})
