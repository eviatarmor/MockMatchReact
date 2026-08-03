import { describe, expect, it } from "vitest"
import { isUnauthorizedError, isSessionUnauthorizedError } from "@/lib/auth/errors"

function fakeTrpcError(code: string, path?: string) {
  return {
    data: { code, path },
  }
}

describe("isUnauthorizedError", () => {
  it("detects UNAUTHORIZED data code", () => {
    expect(isUnauthorizedError(fakeTrpcError("UNAUTHORIZED"))).toBe(true)
    expect(isUnauthorizedError(fakeTrpcError("BAD_REQUEST"))).toBe(false)
    expect(isUnauthorizedError(null)).toBe(false)
  })
})

describe("isSessionUnauthorizedError", () => {
  it("false for auth OTP procedures", () => {
    expect(
      isSessionUnauthorizedError(
        fakeTrpcError("UNAUTHORIZED", "auth.verifyOtp")
      )
    ).toBe(false)
    expect(
      isSessionUnauthorizedError(fakeTrpcError("UNAUTHORIZED", "auth.requestOtp"))
    ).toBe(false)
  })

  it("true for other protected procedures", () => {
    expect(
      isSessionUnauthorizedError(fakeTrpcError("UNAUTHORIZED", "account.get"))
    ).toBe(true)
  })
})
