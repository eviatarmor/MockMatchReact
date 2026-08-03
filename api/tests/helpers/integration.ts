/**
 * Shared helpers for API integration tests.
 * Import only from integration / bench files under tests/.
 */
import { describe, it } from "vitest"
import type { Context as HonoContext } from "hono"
import { appRouter } from "../../src/trpc/router.js"
import { createCallerFactory } from "../../src/trpc/trpc.js"
import type { Context } from "../../src/trpc/context.js"
import { db } from "../../src/db/client.js"
import { createBullMqEventBus } from "../../src/events/bullmq-bus.js"
import { createApp } from "../../src/app.js"
import { env } from "../../src/config/env.js"
import type { Hono } from "hono"

const createAppCaller = createCallerFactory(appRouter)

export type AuthedCaller = ReturnType<typeof createCaller>

export function integrationAvailable(): boolean {
  return process.env.TEST_CONTAINERS_AVAILABLE === "1"
}

/**
 * Run suite when Testcontainers / existing infra is available.
 * With REQUIRE_INTEGRATION=1 (CI), fail loudly instead of skip-as-pass.
 */
export function describeIntegration(name: string, fn: () => void): void {
  if (integrationAvailable()) {
    describe(name, fn)
    return
  }
  if (process.env.REQUIRE_INTEGRATION === "1") {
    describe(name, () => {
      it("requires Docker/Testcontainers (infra unavailable)", () => {
        const reason =
          process.env.TEST_CONTAINERS_REASON ??
          "TEST_CONTAINERS_AVAILABLE is not 1"
        throw new Error(`Integration infra unavailable: ${reason}`)
      })
    })
    return
  }
  describe.skip(name, fn)
}

/**
 * Minimal hono surface for procedure-level callers.
 * Expand fields when a procedure under test reads more of the request.
 */
function createTestHono(): HonoContext {
  const raw = new Request("http://localhost/trpc")
  return {
    req: {
      header: () => undefined,
      raw,
    },
    header: () => undefined,
    get: () => undefined,
    set: () => undefined,
  } as unknown as HonoContext
}

export function createTestContext(user: Context["user"] = null): Context {
  return {
    db,
    bus: createBullMqEventBus(),
    user,
    hono: createTestHono(),
  }
}

/** tRPC caller without HTTP (procedure-level integration). */
export function createCaller(user: Context["user"] = null) {
  return createAppCaller(createTestContext(user))
}

/**
 * OTP signup → authed tRPC caller (shared by integration modules + benches).
 */
export async function signupAuthedCaller(
  label = "user"
): Promise<AuthedCaller> {
  const email = `${label}+${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const publicCaller = createCaller(null)
  await publicCaller.auth.requestOtp({
    purpose: "signup",
    email,
    fullName: `${label} User`,
    agreeToTerms: true,
  })
  const { user } = await publicCaller.auth.verifyOtp({
    email,
    code: env.OTP_STUB_CODE || "000000",
    purpose: "signup",
  })
  return createCaller({ id: user.id, email: user.email })
}

/** Full Hono app for HTTP-level tests (health, cookies, tRPC HTTP). */
export function createTestApp(): Hono {
  return createApp()
}

function setCookieLines(headers: Headers): string[] {
  const multi = (
    headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie
  if (typeof multi === "function") return multi.call(headers)
  const single = headers.get("set-cookie")
  return single ? [single] : []
}

/** Parse `Set-Cookie` header lines into a name→value map. */
export function parseSetCookie(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of setCookieLines(headers)) {
    const [pair = ""] = line.split(";")
    const eq = pair.indexOf("=")
    if (eq > 0) out[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim()
  }
  return out
}
