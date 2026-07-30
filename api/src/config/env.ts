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
    /**
     * OpenRouter model for PDF → structured JSON import.
     * Default: free OpenRouter collection model (see openrouter.ai/collections/free-models).
     */
    OPENROUTER_IMPORT_MODEL: z
      .string()
      .min(1)
      .default("google/gemma-4-26b-a4b-it:free"),
    AWS_REGION: z.string().default("us-east-1"),
    AWS_S3_BUCKET: z.string().optional().default(""),
    AWS_ACCESS_KEY_ID: z.string().optional().default(""),
    AWS_SECRET_ACCESS_KEY: z.string().optional().default(""),
    S3_ENDPOINT: z.string().optional().default(""),
    APP_URL: z.string().url().default("http://localhost:5173"),
    API_URL: z.string().url().default("http://localhost:3000"),
    /** Public WebSocket base (client connects here). */
    WS_URL: z.string().url().default("ws://localhost:3001"),
    WS_PORT: z.coerce.number().int().positive().default(3001),
    /** Debounce before collab Redis snapshot → Postgres. */
    COLLAB_FLUSH_DELAY_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(8_000),
    /**
     * Per-session sandbox name prefix (`{prefix}-{sessionId}`).
     * Empty → sandbox run/PTY disabled.
     */
    SANDBOX_CONTAINER_PREFIX: z.string().default("mm-sbx"),
    /**
     * Isolation backend (pick one boundary — do not stack gVisor under Firecracker):
     * - docker: container + optional gVisor runsc (local / agent without KVM)
     * - firecracker: microVM guest kernel (prod); no gVisor
     * - mock: tests
     */
    SANDBOX_BACKEND: z
      .enum(["docker", "firecracker", "mock"])
      .default("docker"),
    /**
     * When set, api/ws call this orchestrator HTTP base (no local Docker).
     * Required in production when sandbox is enabled.
     */
    SANDBOX_ORCHESTRATOR_URL: z.string().optional().default(""),
    SANDBOX_ORCHESTRATOR_PORT: z.coerce.number().int().positive().default(3010),
    SANDBOX_AGENT_PORT: z.coerce.number().int().positive().default(3011),
    SANDBOX_NODE_ID: z.string().optional().default(""),
    /** Short-lived sandbox tickets (defaults to JWT_ACCESS_SECRET). */
    SANDBOX_TICKET_SECRET: z.string().optional().default(""),
    SANDBOX_TICKET_TTL_SECONDS: z.coerce.number().int().positive().default(300),
    /**
     * Require sandbox JWT tickets. Default false in dev; production forces true
     * via superRefine when sandbox enabled.
     */
    SANDBOX_REQUIRE_TICKETS: z
      .enum(["true", "false", ""])
      .default("false")
      .transform((v) => v === "true"),
    SANDBOX_MAX_CONCURRENT_PER_USER: z.coerce
      .number()
      .int()
      .positive()
      .default(3),
    SANDBOX_MAX_CREATES_PER_USER_HOUR: z.coerce
      .number()
      .int()
      .positive()
      .default(30),
    SANDBOX_MAX_EXECS_PER_USER_HOUR: z.coerce
      .number()
      .int()
      .positive()
      .default(200),
    SANDBOX_MAX_SESSION_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(14_400),
    SANDBOX_REAP_INTERVAL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(60),
    SANDBOX_WIPE_HOST_DIR_ON_DESTROY: z
      .enum(["true", "false", ""])
      .default("false")
      .transform((v) => v === "true"),
    /** Absolute path to seccomp JSON (optional). */
    SANDBOX_SECCOMP_PROFILE: z.string().optional().default(""),
    /**
     * Path to firecracker binary. Empty / "firecracker" →
     * infra/sandbox/agent/bin/firecracker (auto-updated).
     */
    SANDBOX_FIRECRACKER_BIN: z.string().optional().default(""),
    SANDBOX_FIRECRACKER_HELPER: z.string().optional().default(""),
    /**
     * On agent/orchestrator start (and install script): always fetch GitHub
     * **latest** Firecracker if newer than installed. Default true.
     */
    SANDBOX_FIRECRACKER_AUTO_UPDATE: z
      .enum(["true", "false", ""])
      .default("true")
      .transform((v) => v !== "false"),
    /**
     * Dev-only escape hatch: if firecracker binary/helper missing, use Docker
     * backend instead. Default false.
     */
    SANDBOX_FIRECRACKER_FALLBACK_DOCKER: z
      .enum(["true", "false", ""])
      .default("false")
      .transform((v) => v === "true"),
    SANDBOX_REMOTE_PTY: z
      .enum(["true", "false", ""])
      .default("false")
      .transform((v) => v === "true"),
    /** Dangerous: allow Docker on api/ws in production. */
    SANDBOX_ALLOW_INPROCESS_DOCKER_IN_PROD: z
      .enum(["true", "false", ""])
      .default("false")
      .transform((v) => v === "true"),
    /**
     * Image built by `npm run sandbox:up` (compose build).
     */
    SANDBOX_IMAGE: z.string().default("mockmatch-sandbox:local"),
    /**
     * Docker **only** (`SANDBOX_BACKEND=docker`): container runtime.
     * Default gVisor `runsc`. Use `runc` if gVisor unavailable.
     * Empty omits `--runtime`. **Ignored for Firecracker** (microVM has its own kernel).
     */
    SANDBOX_RUNTIME: z.string().default("runsc"),
    SANDBOX_MEM_LIMIT: z.string().default("512m"),
    SANDBOX_CPUS: z.string().default("1.0"),
    SANDBOX_PIDS_LIMIT: z.coerce.number().int().positive().default(256),
    /**
     * Host root for session dirs (`{dir}/sessions/{id}` → guest `/workspace`).
     * Default: monorepo infra/sandbox/workspace.
     */
    SANDBOX_WORKSPACE_DIR: z.string().optional().default(""),
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
    /**
     * Optional path to Chromium for Playwright PDF export.
     * Leave empty to use Playwright's bundled browser.
     */
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: z.string().optional().default(""),
    /** Headless print page wait + PDF timeout (ms). */
    PDF_EXPORT_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
    /**
     * Adzuna job search (optional). Empty → jobs.search returns not-configured.
     * Register free keys at https://developer.adzuna.com/
     */
    ADZUNA_APP_ID: z.string().optional().default(""),
    ADZUNA_APP_KEY: z.string().optional().default(""),
    /** Redis TTL for cached job search results (seconds). */
    JOBS_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(600),
    /**
     * OpenRouter model for Discover AI job-fit (credits path when cost > 0).
     * Default: free OpenRouter model — $0 on OpenRouter; still subject to JOB_FIT_AI_CREDIT_COST.
     * Free-model catalog: https://openrouter.ai/collections/free-models
     */
    OPENROUTER_FIT_MODEL: z
      .string()
      .min(1)
      .default("openai/gpt-oss-20b:free"),
    /**
     * Free OpenRouter model for Discover card job summaries.
     * Catalog: https://openrouter.ai/collections/free-models
     */
    OPENROUTER_SUMMARY_MODEL: z
      .string()
      .min(1)
      .default("openai/gpt-oss-20b:free"),
    /**
     * Free OpenRouter model for the in-app Ask product assistant.
     * Catalog: https://openrouter.ai/collections/free-models
     */
    OPENROUTER_ASK_MODEL: z
      .string()
      .min(1)
      .default("openai/gpt-oss-20b:free"),
    /**
     * Free OpenRouter model for resume / cover-letter editor AI assistant.
     * Catalog: https://openrouter.ai/collections/free-models
     */
    OPENROUTER_DOCUMENT_AI_MODEL: z
      .string()
      .min(1)
      .default("openai/gpt-oss-20b:free"),
    /** Credits charged per uncached AI-scored job. 0 = free AI when key configured. */
    JOB_FIT_AI_CREDIT_COST: z.coerce.number().int().nonnegative().default(0),
    /**
     * Capable-cheap OpenRouter model for Fit resume / Fit cover letter generation.
     * Stronger than free Discover fit scorer; keep cost-conscious for production.
     */
    OPENROUTER_FIT_DOC_MODEL: z
      .string()
      .min(1)
      .default("google/gemini-2.5-flash"),
    /** Credits per Fit resume (charged to resumeScans). 0 = free when key configured. */
    FIT_RESUME_CREDIT_COST: z.coerce.number().int().nonnegative().default(5),
    /** Credits per Fit cover letter (charged to coverLetters). */
    FIT_COVER_LETTER_CREDIT_COST: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(4),
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
      const sandboxOn = Boolean(data.SANDBOX_CONTAINER_PREFIX?.trim())
      if (
        sandboxOn &&
        !data.SANDBOX_ORCHESTRATOR_URL.trim() &&
        !data.SANDBOX_ALLOW_INPROCESS_DOCKER_IN_PROD
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["SANDBOX_ORCHESTRATOR_URL"],
          message:
            "Production multi-tenant isolation requires SANDBOX_ORCHESTRATOR_URL (or set SANDBOX_ALLOW_INPROCESS_DOCKER_IN_PROD=true to override — not recommended)",
        })
      }
      if (sandboxOn && data.SANDBOX_BACKEND === "docker" && !data.SANDBOX_ALLOW_INPROCESS_DOCKER_IN_PROD) {
        // docker backend is OK on the orchestrator/agent node; api/ws must use remote URL
        if (!data.SANDBOX_ORCHESTRATOR_URL.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["SANDBOX_BACKEND"],
            message:
              "Production api/ws must not run Docker backend in-process; use orchestrator + firecracker/docker on agent nodes",
          })
        }
      }
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
