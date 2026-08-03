/**
 * Shared helpers for API integration tests.
 * Import only from *.integration.test.ts files.
 */
import { describe } from "vitest"
import { appRouter } from "../../src/trpc/router.js"
import { createCallerFactory } from "../../src/trpc/trpc.js"
import type { Context } from "../../src/trpc/context.js"
import { db } from "../../src/db/client.js"
import { createBullMqEventBus } from "../../src/events/bullmq-bus.js"
import { createApp } from "../../src/app.js"
import type { Hono } from "hono"

const createAppCaller = createCallerFactory(appRouter)


export function integrationAvailable(): boolean {
  return process.env.TEST_CONTAINERS_AVAILABLE === "1"
}

/** Skip entire suite when Testcontainers / existing infra is unavailable. */
export function describeIntegration(
  name: string,
  fn: () => void
): void {
  const run = integrationAvailable() ? describe : describe.skip
  run(name, fn)
}

/**
 * Same skip rule for Vitest `bench` files (DB / Redis / HTTP-in-process).
 * Uses describe.skip when Docker/infra is down so `vitest bench` exits 0.
 */
export function describeBenchIntegration(
  name: string,
  fn: () => void
): void {
  describeIntegration(name, fn)
}

export function createTestContext(
  user: Context["user"] = null
): Context {
  // Minimal Hono context stub for cookie helpers in procedures that need it.
  const cookieStore = new Map<string, string>()
  const hono = {
    req: {
      header: () => undefined,
      raw: new Request("http://localhost/trpc"),
    },
    header: () => undefined,
    // Cookie helpers used by hono/cookie read/write via getCookie/setCookie.
    get: (key: string) => {
      if (key === "cookie") {
        return [...cookieStore.entries()]
          .map(([k, v]) => `${k}=${v}`)
          .join("; ")
      }
      return undefined
    },
    set: (key: string, value: unknown) => {
      if (key.startsWith("cookie:")) {
        // not used
      }
      void key
      void value
    },
  } as unknown as Context["hono"]

  // Patch cookie map for tests that use setAuthCookies via real Hono app.
  void cookieStore

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

/** Full Hono app for HTTP-level tests (health, cookies, tRPC HTTP). */
export function createTestApp(): Hono {
  return createApp()
}

export function parseSetCookie(
  headers: Headers
): Record<string, string> {
  const out: Record<string, string> = {}
  // undici / fetch may expose getSetCookie
  const raw =
    typeof (headers as Headers & { getSetCookie?: () => string[] })
      .getSetCookie === "function"
      ? (headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie")!]
        : []

  for (const line of raw) {
    const [pair] = line.split(";")
    if (!pair) continue
    const eq = pair.indexOf("=")
    if (eq < 0) continue
    const name = pair.slice(0, eq).trim()
    const value = pair.slice(eq + 1).trim()
    out[name] = value
  }
  return out
}
