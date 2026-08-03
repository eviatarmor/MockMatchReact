import { describe, expect, it } from "vitest"
import {
  generateOtpCode,
  hashToken,
  normalizeEmail,
  safeEqualHex,
} from "@/lib/crypto.js"

describe("hashToken", () => {
  it("returns stable sha256 hex", () => {
    const a = hashToken("hello")
    const b = hashToken("hello")
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })

  it("differs for different inputs", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"))
  })
})

describe("safeEqualHex", () => {
  it("returns true for equal hex digests", () => {
    const h = hashToken("secret")
    expect(safeEqualHex(h, h)).toBe(true)
  })

  it("returns false for different lengths", () => {
    expect(safeEqualHex("aa", "aabb")).toBe(false)
  })

  it("returns false for mismatched digests", () => {
    expect(safeEqualHex(hashToken("a"), hashToken("b"))).toBe(false)
  })
})

describe("generateOtpCode", () => {
  it("uses stub when valid 6 digits", () => {
    expect(generateOtpCode("123456")).toBe("123456")
  })

  it("ignores invalid stub and returns 6 digits", () => {
    const code = generateOtpCode("12")
    expect(code).toMatch(/^\d{6}$/)
  })

  it("returns 6 digits when stub undefined", () => {
    expect(generateOtpCode(undefined)).toMatch(/^\d{6}$/)
  })
})

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com")
  })
})
