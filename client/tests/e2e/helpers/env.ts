/** E2E env. App + API must be running unless E2E_SKIP=1. */

export const E2E_SKIP = process.env.E2E_SKIP === "1"

export const E2E_BASE_URL =
  process.env.E2E_BASE_URL ?? "http://localhost:5173"

export const E2E_API_URL =
  process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://localhost:3000"

/** Collab WebSocket (npm run dev:ws). */
export const E2E_WS_URL =
  process.env.E2E_WS_URL ?? process.env.WS_URL ?? "ws://localhost:3001"

/** Matches api OTP_STUB_CODE default in development. */
export const E2E_OTP_CODE = process.env.E2E_OTP_CODE ?? "000000"

export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}
