import { describe, expect, it } from "vitest"
import {
  signAccessToken,
  signCollabTicket,
  signRefreshToken,
  signVoiceTicket,
  verifyAccessToken,
  verifyCollabTicket,
  verifyRefreshToken,
} from "@/lib/jwt.js"

describe("access / refresh JWT", () => {
  it("round-trips access token", async () => {
    const token = await signAccessToken({
      userId: "user-1",
      email: "a@example.com",
    })
    const payload = await verifyAccessToken(token)
    expect(payload.sub).toBe("user-1")
    expect(payload.email).toBe("a@example.com")
    expect(payload.type).toBe("access")
  })

  it("round-trips refresh token", async () => {
    const token = await signRefreshToken({ userId: "user-2" })
    const payload = await verifyRefreshToken(token)
    expect(payload.sub).toBe("user-2")
    expect(payload.type).toBe("refresh")
  })

  it("rejects access token verified as refresh", async () => {
    const token = await signAccessToken({
      userId: "user-1",
      email: "a@example.com",
    })
    await expect(verifyRefreshToken(token)).rejects.toThrow()
  })
})

describe("collab / voice tickets", () => {
  it("round-trips collab ticket", async () => {
    const token = await signCollabTicket({
      sub: "u1",
      email: "a@example.com",
      name: "Ada",
      kind: "resume",
      documentId: "doc-1",
      role: "edit",
      ownerUserId: "owner-1",
    })
    const payload = await verifyCollabTicket(token)
    expect(payload.documentId).toBe("doc-1")
    expect(payload.role).toBe("edit")
    expect(payload.type).toBe("collab")
  })

  it("signs voice ticket with session + jti", async () => {
    const token = await signVoiceTicket({
      userId: "u1",
      sessionId: "sess-1",
      jti: "jti-1",
    })
    expect(typeof token).toBe("string")
    expect(token.split(".")).toHaveLength(3)
  })
})
