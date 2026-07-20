import type { Context } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import { env } from "../config/env.js"

export const ACCESS_COOKIE = "mm_access"
export const REFRESH_COOKIE = "mm_refresh"

/** Matches JWT access TTL (`15m` in jwt.ts). */
const ACCESS_MAX_AGE_SEC = 15 * 60
/** Matches JWT refresh TTL (`30d` in jwt.ts). */
const REFRESH_MAX_AGE_SEC = 30 * 24 * 60 * 60

function baseCookieOptions() {
  return {
    httpOnly: true as const,
    secure: env.NODE_ENV === "production",
    sameSite: "Lax" as const,
    path: "/",
  }
}

export function getAccessTokenFromCookie(c: Context): string | undefined {
  return getCookie(c, ACCESS_COOKIE)
}

export function getRefreshTokenFromCookie(c: Context): string | undefined {
  return getCookie(c, REFRESH_COOKIE)
}

export function setAuthCookies(
  c: Context,
  tokens: { accessToken: string; refreshToken: string }
): void {
  const base = baseCookieOptions()
  setCookie(c, ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    maxAge: ACCESS_MAX_AGE_SEC,
  })
  setCookie(c, REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    maxAge: REFRESH_MAX_AGE_SEC,
  })
}

export function clearAuthCookies(c: Context): void {
  const base = baseCookieOptions()
  deleteCookie(c, ACCESS_COOKIE, { path: base.path })
  deleteCookie(c, REFRESH_COOKIE, { path: base.path })
}
