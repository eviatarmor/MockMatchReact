import { config as loadDotenv } from "dotenv"
import { z } from "zod"

loadDotenv()

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(8),
    JWT_REFRESH_SECRET: z.string().min(8),
    /**
     * Fixed OTP for local/dev only. Empty → random 6-digit.
     * Forbidden in production (see superRefine).
     */
    OTP_STUB_CODE: z
      .string()
      .default("")
      .refine((value) => value === "" || /^\d{6}$/.test(value), {
        message: "OTP_STUB_CODE must be empty or a 6-digit string",
      }),
    OTP_TTL_MINUTES: z.coerce.number().int().positive().default(10),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    SMTP_HOST: z.string().optional().default(""),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional().default(""),
    SMTP_PASS: z.string().optional().default(""),
    SMTP_FROM: z.string().optional().default("MockMatch <noreply@mockmatch.local>"),
    OPENROUTER_API_KEY: z.string().optional().default(""),
    AWS_REGION: z.string().default("us-east-1"),
    AWS_S3_BUCKET: z.string().optional().default(""),
    AWS_ACCESS_KEY_ID: z.string().optional().default(""),
    AWS_SECRET_ACCESS_KEY: z.string().optional().default(""),
    S3_ENDPOINT: z.string().optional().default(""),
    APP_URL: z.string().url().default("http://localhost:5173"),
    API_URL: z.string().url().default("http://localhost:3000"),
    /** LinkedIn OAuth (optional until portal + redirect wired). */
    LINKEDIN_CLIENT_ID: z.string().optional().default(""),
    LINKEDIN_CLIENT_SECRET: z.string().optional().default(""),
    LINKEDIN_REDIRECT_URI: z.string().optional().default(""),
    /** Stripe (optional in local dev — billing summary still works). */
    STRIPE_SECRET_KEY: z.string().optional().default(""),
    STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
    STRIPE_PRICE_CREDITS_100: z.string().optional().default(""),
    STRIPE_PRICE_CREDITS_500: z.string().optional().default(""),
    STRIPE_PRICE_CREDITS_1000: z.string().optional().default(""),
    /** Free-tier AI credit grant when credit_account is first created. */
    FREE_CREDIT_GRANT: z.coerce.number().int().nonnegative().default(0),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && data.OTP_STUB_CODE !== "") {
      ctx.addIssue({
        code: "custom",
        path: ["OTP_STUB_CODE"],
        message: "OTP_STUB_CODE must be empty in production",
      })
    }
    if (data.NODE_ENV === "production") {
      if (data.JWT_ACCESS_SECRET.length < 32) {
        ctx.addIssue({
          code: "custom",
          path: ["JWT_ACCESS_SECRET"],
          message: "JWT_ACCESS_SECRET must be at least 32 characters in production",
        })
      }
      if (data.JWT_REFRESH_SECRET.length < 32) {
        ctx.addIssue({
          code: "custom",
          path: ["JWT_REFRESH_SECRET"],
          message: "JWT_REFRESH_SECRET must be at least 32 characters in production",
        })
      }
    }
    const hasAnyPrice =
      data.STRIPE_PRICE_CREDITS_100 !== "" ||
      data.STRIPE_PRICE_CREDITS_500 !== "" ||
      data.STRIPE_PRICE_CREDITS_1000 !== ""
    if (hasAnyPrice && data.STRIPE_SECRET_KEY === "") {
      ctx.addIssue({
        code: "custom",
        path: ["STRIPE_SECRET_KEY"],
        message: "STRIPE_SECRET_KEY is required when credit price IDs are set",
      })
    }
  })

export type Env = z.infer<typeof envSchema>

function parseEnv(): Env {
  // Dev default stub only when unset (keeps local OTP easy without forcing prod risk)
  if (
    process.env.OTP_STUB_CODE === undefined &&
    (process.env.NODE_ENV === undefined ||
      process.env.NODE_ENV === "development")
  ) {
    process.env.OTP_STUB_CODE = "000000"
  }

  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n")
    throw new Error(`Invalid environment variables:\n${formatted}`)
  }
  return result.data
}

export const env = parseEnv()
