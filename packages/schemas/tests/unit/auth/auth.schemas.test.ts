import { describe, expect, it } from "vitest"
import { loginSchema } from "@/auth/login.js"
import { signupSchema } from "@/auth/signup.js"
import {
  otpPurposeSchema,
  refreshTokenSchema,
  requestLoginOtpSchema,
  requestOtpSchema,
  requestSignupOtpSchema,
  verifyOtpSchema,
} from "@/auth/otp.js"

describe("loginSchema", () => {
  it("accepts valid email", () => {
    expect(loginSchema.parse({ email: "a@b.co" }).email).toBe("a@b.co")
  })

  it("rejects invalid email", () => {
    expect(() => loginSchema.parse({ email: "nope" })).toThrow()
    expect(() => loginSchema.parse({})).toThrow()
  })
})

describe("signupSchema", () => {
  it("requires fullName + terms", () => {
    const ok = signupSchema.parse({
      fullName: "Ada",
      email: "ada@example.com",
      agreeToTerms: true,
    })
    expect(ok.fullName).toBe("Ada")

    expect(() =>
      signupSchema.parse({
        fullName: "",
        email: "ada@example.com",
        agreeToTerms: true,
      })
    ).toThrow()

    expect(() =>
      signupSchema.parse({
        fullName: "Ada",
        email: "ada@example.com",
        agreeToTerms: false,
      })
    ).toThrow()
  })
})

describe("otpPurposeSchema", () => {
  it("login | signup only", () => {
    expect(otpPurposeSchema.parse("login")).toBe("login")
    expect(otpPurposeSchema.parse("signup")).toBe("signup")
    expect(() => otpPurposeSchema.parse("reset")).toThrow()
  })
})

describe("requestOtpSchema", () => {
  it("discriminates login vs signup", () => {
    expect(
      requestOtpSchema.parse({ purpose: "login", email: "a@b.co" }).purpose
    ).toBe("login")

    expect(
      requestOtpSchema.parse({
        purpose: "signup",
        email: "a@b.co",
        fullName: "A",
        agreeToTerms: true,
      }).purpose
    ).toBe("signup")
  })

  it("signup branch still enforces terms", () => {
    expect(() =>
      requestOtpSchema.parse({
        purpose: "signup",
        email: "a@b.co",
        fullName: "A",
        agreeToTerms: false,
      })
    ).toThrow()
  })
})

describe("requestLoginOtpSchema / requestSignupOtpSchema", () => {
  it("login defaults purpose", () => {
    const v = requestLoginOtpSchema.parse({ email: "a@b.co" })
    expect(v.purpose).toBe("login")
  })

  it("signup extends signupSchema", () => {
    const v = requestSignupOtpSchema.parse({
      fullName: "Ada",
      email: "ada@example.com",
      agreeToTerms: true,
    })
    expect(v.purpose).toBe("signup")
  })
})

describe("verifyOtpSchema", () => {
  it("requires 6-digit code", () => {
    expect(
      verifyOtpSchema.parse({
        email: "a@b.co",
        code: "123456",
        purpose: "login",
      }).code
    ).toBe("123456")

    expect(() =>
      verifyOtpSchema.parse({
        email: "a@b.co",
        code: "12345",
        purpose: "login",
      })
    ).toThrow()

    expect(() =>
      verifyOtpSchema.parse({
        email: "a@b.co",
        code: "1234567",
        purpose: "signup",
      })
    ).toThrow()
  })
})

describe("refreshTokenSchema", () => {
  it("allows empty body (cookie path)", () => {
    expect(refreshTokenSchema.parse({})).toEqual({})
  })

  it("accepts optional body token", () => {
    expect(
      refreshTokenSchema.parse({ refreshToken: "tok" }).refreshToken
    ).toBe("tok")
    expect(() =>
      refreshTokenSchema.parse({ refreshToken: "" })
    ).toThrow()
  })
})
