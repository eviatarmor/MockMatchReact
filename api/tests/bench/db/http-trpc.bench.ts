import { beforeAll, bench } from "vitest"
import { env } from "@/config/env.js"
import {
  createCaller,
  createTestApp,
  describeIntegration,
  integrationAvailable,
} from "../../helpers/integration.js"
import { trpcQueryPath } from "../../helpers/trpc-http.js"

/**
 * In-process Hono + tRPC over real DB (no TCP server).
 * Wire format matches Playwright E2E helpers (raw JSON input, no superjson).
 */
describeIntegration("db HTTP tRPC (in-process Hono)", () => {
  const app = createTestApp()
  let accessCookie = ""
  let resumeId = ""

  beforeAll(async () => {
    if (!integrationAvailable()) return

    const email = `bench-http+${Date.now()}@example.com`
    const pub = createCaller(null)
    await pub.auth.requestOtp({
      purpose: "signup",
      email,
      fullName: "HTTP Bench",
      agreeToTerms: true,
    })
    const tokens = await pub.auth.verifyOtp({
      email,
      code: env.OTP_STUB_CODE || "000000",
      purpose: "signup",
    })
    const authed = createCaller({
      id: tokens.user.id,
      email: tokens.user.email,
    })
    const created = await authed.resumes.create({ title: "HTTP Bench Resume" })
    resumeId = created.id

    const { signAccessToken } = await import("@/lib/jwt.js")
    const jwt = await signAccessToken({
      userId: tokens.user.id,
      email: tokens.user.email,
    })
    accessCookie = `mm_access=${jwt}`
  }, 120_000)

  bench("GET /health", async () => {
    await app.request("/health")
  })

  bench("GET /ready (Postgres+Redis ping)", async () => {
    await app.request("/ready")
  })

  bench("tRPC resumes.list over HTTP", async () => {
    await app.request(trpcQueryPath("resumes.list", { page: 1, pageSize: 10 }), {
      headers: { cookie: accessCookie },
    })
  })

  bench("tRPC resumes.get over HTTP", async () => {
    await app.request(trpcQueryPath("resumes.get", { id: resumeId }), {
      headers: { cookie: accessCookie },
    })
  })
})
