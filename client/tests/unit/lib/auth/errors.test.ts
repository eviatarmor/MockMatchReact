import { describe, expect, it } from "vitest"
import { TRPCClientError } from "@trpc/client"
import {
  isUnauthorizedError,
  isSessionUnauthorizedError,
} from "@/lib/auth/errors"

function trpcError(code: string, path?: string) {
  return TRPCClientError.from(
    {
      error: {
        message: code,
        code: -32001,
        data: { code, path, httpStatus: 401 },
      },
    },
    { meta: undefined }
  )
}

describe("isUnauthorizedError", () => {
  it("detects TRPCClientError UNAUTHORIZED", () => {
    expect(isUnauthorizedError(trpcError("UNAUTHORIZED"))).toBe(true)
    expect(isUnauthorizedError(trpcError("BAD_REQUEST"))).toBe(false)
    expect(isUnauthorizedError(null)).toBe(false)
  })
})

describe("isSessionUnauthorizedError", () => {
  it("false for auth OTP procedures", () => {
    expect(
      isSessionUnauthorizedError(trpcError("UNAUTHORIZED", "auth.verifyOtp"))
    ).toBe(false)
    expect(
      isSessionUnauthorizedError(trpcError("UNAUTHORIZED", "auth.requestOtp"))
    ).toBe(false)
  })

  it("true for other protected procedures", () => {
    expect(
      isSessionUnauthorizedError(trpcError("UNAUTHORIZED", "account.get"))
    ).toBe(true)
  })
})
