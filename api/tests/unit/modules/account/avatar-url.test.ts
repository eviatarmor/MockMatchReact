import { describe, expect, it } from "vitest"
import {
  buildAvatarPublicUrl,
  signAvatarQuery,
  verifyAvatarQuery,
} from "@/modules/account/avatar-url.js"

describe("signAvatarQuery / verifyAvatarQuery", () => {
  const userId = "11111111-1111-1111-1111-111111111111"
  const versionMs = Date.now() - 60_000

  it("round-trips a valid signature", () => {
    const sig = signAvatarQuery(userId, versionMs)
    expect(sig).toMatch(/^[a-f0-9]{64}$/)
    expect(verifyAvatarQuery(userId, versionMs, sig)).toBe(true)
  })

  it("rejects wrong user, version, or sig", () => {
    const sig = signAvatarQuery(userId, versionMs)
    expect(verifyAvatarQuery("other-user", versionMs, sig)).toBe(false)
    expect(verifyAvatarQuery(userId, versionMs + 1, sig)).toBe(false)
    expect(verifyAvatarQuery(userId, versionMs, "0".repeat(64))).toBe(false)
  })

  it("rejects empty inputs", () => {
    expect(verifyAvatarQuery("", versionMs, "abc")).toBe(false)
    expect(verifyAvatarQuery(userId, Number.NaN, "abc")).toBe(false)
    expect(verifyAvatarQuery(userId, versionMs, "")).toBe(false)
  })

  it("rejects links older than 30 days", () => {
    const old = Date.now() - 31 * 24 * 60 * 60 * 1000
    const sig = signAvatarQuery(userId, old)
    expect(verifyAvatarQuery(userId, old, sig)).toBe(false)
  })

  it("rejects far-future timestamps beyond 1 minute skew", () => {
    const future = Date.now() + 5 * 60_000
    const sig = signAvatarQuery(userId, future)
    expect(verifyAvatarQuery(userId, future, sig)).toBe(false)
  })
})

describe("buildAvatarPublicUrl", () => {
  const userId = "22222222-2222-2222-2222-222222222222"

  it("returns null without avatar key", () => {
    expect(buildAvatarPublicUrl(userId, null, new Date())).toBeNull()
    expect(buildAvatarPublicUrl(userId, "  ", new Date())).toBeNull()
    expect(buildAvatarPublicUrl(userId, undefined, new Date())).toBeNull()
  })

  it("builds signed API URL with version and sig", () => {
    // Must be within verifyAvatarQuery's 30d window
    const updatedAt = new Date(Date.now() - 60_000)
    const url = buildAvatarPublicUrl(userId, "avatars/u/photo.jpg", updatedAt)
    expect(url).toMatch(
      new RegExp(
        `^http://localhost:3000/account/avatar/${userId}\\?v=${updatedAt.getTime()}&sig=[a-f0-9]{64}$`
      )
    )
    const v = updatedAt.getTime()
    const sig = new URL(url!).searchParams.get("sig")!
    expect(verifyAvatarQuery(userId, v, sig)).toBe(true)
  })

  it("accepts ISO string updatedAt", () => {
    const iso = new Date(Date.now() - 120_000).toISOString()
    const url = buildAvatarPublicUrl(userId, "k", iso)
    expect(url).toContain(`v=${new Date(iso).getTime()}`)
  })
})
