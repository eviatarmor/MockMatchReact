import { describe, expect, it } from "vitest"
import { avatarClassFor, titleToAvatarText } from "@/lib/title-avatar"

describe("titleToAvatarText", () => {
  it("handles empty / single / multi", () => {
    expect(titleToAvatarText("")).toBe("?")
    expect(titleToAvatarText("  ")).toBe("?")
    expect(titleToAvatarText("Ada")).toBe("AD")
    expect(titleToAvatarText("Ada Lovelace")).toBe("AL")
  })
})

describe("avatarClassFor", () => {
  it("returns stable class for same text", () => {
    expect(avatarClassFor("Ada")).toBe(avatarClassFor("Ada"))
  })
})
