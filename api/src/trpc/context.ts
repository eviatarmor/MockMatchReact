import type { Context as HonoContext } from "hono"
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"
import { db, type Database } from "../db/client.js"
import { createBullMqEventBus } from "../events/bullmq-bus.js"
import type { EventBus } from "../events/bus.js"
import { getAccessTokenFromCookie } from "../lib/cookies.js"
import { verifyAccessToken } from "../lib/jwt.js"

export interface AuthUser {
  id: string
  email: string
}

export interface Context extends Record<string, unknown> {
  db: Database
  bus: EventBus
  user: AuthUser | null
  /** Hono request context — used to read/set HttpOnly auth cookies. */
  hono: HonoContext
}

const bus = createBullMqEventBus()

function extractBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith("Bearer ")) return null
  return authorization.slice("Bearer ".length).trim() || null
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
  hono: HonoContext
): Promise<Context> {
  const cookieToken = getAccessTokenFromCookie(hono)
  const headerToken = extractBearerToken(opts.req.headers.get("authorization"))
  const token = cookieToken || headerToken
  let user: AuthUser | null = null

  if (token) {
    try {
      const payload = await verifyAccessToken(token)
      user = { id: payload.sub, email: String(payload.email ?? "") }
    } catch {
      user = null
    }
  }

  return { db, bus, user, hono }
}
