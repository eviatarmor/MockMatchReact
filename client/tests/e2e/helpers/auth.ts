import type { APIRequestContext, Browser, BrowserContext, Page } from "@playwright/test"
import { E2E_API_URL, E2E_OTP_CODE, uniqueEmail } from "./env"
import { assertTrpcOk, trpcMutation } from "./trpc"

export type E2EUser = {
  email: string
  fullName: string
  /** Playwright storage state path-ready object */
  storageState: Awaited<ReturnType<APIRequestContext["storageState"]>>
}

/**
 * Create a fresh user via API OTP (stub code) and return cookie storage.
 * Prefer `authenticatedContext` which signs up on the browser cookie jar
 * so mm_access is visible to both the UI origin and API origin.
 */
export async function signupViaApi(
  request: APIRequestContext,
  opts?: { email?: string; fullName?: string; code?: string }
): Promise<E2EUser> {
  const email = opts?.email ?? uniqueEmail("signup")
  const fullName = opts?.fullName ?? "E2E User"
  const code = opts?.code ?? E2E_OTP_CODE

  const reqRes = await trpcMutation(request, "auth.requestOtp", {
    purpose: "signup",
    email,
    fullName,
    agreeToTerms: true,
  })
  await assertTrpcOk(reqRes, "auth.requestOtp")

  const verifyRes = await trpcMutation(request, "auth.verifyOtp", {
    purpose: "signup",
    email,
    code,
  })
  await assertTrpcOk(verifyRes, "auth.verifyOtp")

  const storageState = await request.storageState()
  // Normalize cookies onto 127.0.0.1 / localhost so browser pages share them
  // with API (Playwright host-only cookies can stick to the API port only).
  const baseHost = new URL(E2E_API_URL).hostname
  storageState.cookies = storageState.cookies.map((c) => ({
    ...c,
    domain: c.domain || baseHost,
    path: c.path || "/",
    sameSite: (c.sameSite as "Lax" | "Strict" | "None") || "Lax",
  }))
  return { email, fullName, storageState }
}

/** New browser context: signup on that context’s request so cookies stick. */
export async function authenticatedContext(
  browser: Browser,
  opts?: { email?: string; fullName?: string }
): Promise<{ context: BrowserContext; user: E2EUser }> {
  const context = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
  })
  const user = await signupViaApi(context.request, opts)
  // Re-apply cookies with explicit URLs for UI + API hosts
  const host = new URL(E2E_API_URL).hostname
  const cookies = user.storageState.cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: host,
    path: "/",
    httpOnly: c.httpOnly,
    secure: false,
    sameSite: "Lax" as const,
  }))
  if (cookies.length > 0) {
    await context.addCookies(cookies)
  }
  return { context, user }
}

/**
 * UI signup path (true browser E2E). Requires API + OTP stub.
 */
export async function signupViaUi(
  page: Page,
  opts?: { email?: string; fullName?: string; code?: string }
): Promise<{ email: string; fullName: string }> {
  const email = opts?.email ?? uniqueEmail("ui")
  const fullName = opts?.fullName ?? "UI E2E User"
  const code = opts?.code ?? E2E_OTP_CODE

  await page.goto("/signup")
  await page.locator("#fullName").fill(fullName)
  await page.locator("#email").fill(email)
  // Base UI checkbox is aria-hidden — click the visible label
  await page.locator('label[for="agreeToTerms"]').click()
  await page.getByRole("button", { name: "Continue", exact: true }).click()

  // Wait for OTP step
  await page.getByRole("button", { name: /verify/i }).waitFor({
    state: "visible",
    timeout: 20_000,
  })

  // input-otp: fill first slot or hidden input
  const otpRoot = page.locator("[data-input-otp], input[autocomplete='one-time-code']").first()
  if (await otpRoot.count()) {
    await otpRoot.click()
    await page.keyboard.type(code, { delay: 30 })
  } else {
    // Fallback: all single-char inputs in the code step
    const digits = page.locator('input[maxlength="1"], input[inputmode="numeric"]')
    const n = await digits.count()
    if (n >= 6) {
      for (let i = 0; i < 6; i++) {
        await digits.nth(i).fill(code[i]!)
      }
    } else {
      await page.locator("input").last().fill(code)
    }
  }

  await page.getByRole("button", { name: /verify/i }).click()
  await page.waitForURL(/\/(resume-lab|discover|cover-letters)/, {
    timeout: 30_000,
  })

  return { email, fullName }
}

/** Health check — skip suite if API down. */
export async function apiReachable(request: APIRequestContext): Promise<boolean> {
  try {
    const res = await request.get(`${E2E_API_URL}/health`, { timeout: 3_000 })
    return res.ok()
  } catch {
    return false
  }
}
