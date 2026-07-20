import { z } from "zod"
import { loginSchema } from "./login.js"
import { signupSchema } from "./signup.js"

export const otpPurposeSchema = z.enum(["login", "signup"])

export type OtpPurpose = z.infer<typeof otpPurposeSchema>

export const requestLoginOtpSchema = loginSchema.extend({
  purpose: z.literal("login").default("login"),
})

export const requestSignupOtpSchema = signupSchema.extend({
  purpose: z.literal("signup").default("signup"),
})

export const requestOtpSchema = z.discriminatedUnion("purpose", [
  z.object({
    purpose: z.literal("login"),
    email: z.string().email("Enter a valid email address"),
  }),
  z.object({
    purpose: z.literal("signup"),
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email address"),
    agreeToTerms: z
      .boolean()
      .refine((value) => value, "You must agree to the Terms and Privacy Policy"),
  }),
])

export type RequestOtpInput = z.infer<typeof requestOtpSchema>

export const verifyOtpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  code: z.string().length(6, "Enter the 6-digit code"),
  purpose: otpPurposeSchema,
})

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>

/** Refresh/logout prefer HttpOnly cookie; body token is optional fallback. */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(),
})

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
