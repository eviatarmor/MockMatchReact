import { beforeAll, bench, describe } from "vitest"
import { env } from "@/config/env.js"
import {
  createCaller,
  createTestApp,
  describeBenchIntegration,
  integrationAvailable,
} from "../../helpers/integration.js"

/**
 * In-process Hono + tRPC over real DB (no TCP server).
 * Closer to "API latency" than pure function benches; still not multi-client k6.
 */
describeBenchIntegration("db HTTP tRPC (in-process Hono)", () => {
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
    // Caller returns tokens only if service returns them — verifyOtp via
    // createCaller may not set cookies; use signed access via service path.
    // Prefer minting list via caller then HTTP with Authorization if needed.
    const authed = createCaller({
      id: tokens.user.id,
      email: tokens.user.email,
    })
    const created = await authed.resumes.create({ title: "HTTP Bench Resume" })
    resumeId = created.id

    // signAccessToken-style: use cookie from a real HTTP verify if available.
    // Fallback: tRPC HTTP with no cookie uses public procedures only.
    // Protected HTTP needs JWT — issue via lib.
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
    const input = encodeURIComponent(
      JSON.stringify({ json: { page: 1, pageSize: 10 } })
    )
    await app.request(`/trpc/resumes.list?input=${input}`, {
      headers: {
        cookie: accessCookie,
      },
    })
  })

  bench("tRPC resumes.get over HTTP", async () => {
    const input = encodeURIComponent(
      JSON.stringify({ json: { id: resumeId } })
    )
    await app.request(`/trpc/resumes.get?input=${input}`, {
      headers: {
        cookie: accessCookie,
      },
    })
  })
})

