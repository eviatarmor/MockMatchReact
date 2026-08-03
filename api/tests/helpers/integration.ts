/**
 * Shared helpers for API integration tests.
 * Import only from integration / bench files under tests/.
 */
import { describe } from "vitest"
import type { Hono } from "hono"
import { appRouter } from "../../src/trpc/router.js"
import { createCallerFactory } from "../../src/trpc/trpc.js"
import type { Context } from "../../src/trpc/context.js"
import { db } from "../../src/db/client.js"
import { createBullMqEventBus } from "../../src/events/bullmq-bus.js"
import { createApp } from "../../src/app.js"
import { env } from "../../src/config/env.js"

const createAppCaller = createCallerFactory(appRouter)

export type AuthedCaller = ReturnType<typeof createCaller>

export function integrationAvailable(): boolean {
  return process.env.TEST_CONTAINERS_AVAILABLE === "1"
}

/** Skip suite when Testcontainers / existing infra is unavailable. */
export function describeIntegration(name: string, fn: () => void): void {
  ;(integrationAvailable() ? describe : describe.skip)(name, fn)
}

/** Same skip rule for Vitest `bench` files (DB / Redis / HTTP-in-process). */
export function describeBenchIntegration(name: string, fn: () => void): void {
  describeIntegration(name, fn)
}

export function createTestContext(user: Context["user"] = null): Context {
  const hono = {
    req: {
      header: () => undefined,
      raw: new Request("http://localhost/trpc"),
    },
    header: () => undefined,
    get: () => undefined,
    set: () => undefined,
  } as unknown as Context["hono"]

  return {
    db,
    bus: createBullMqEventBus(),
    user,
    hono,
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
