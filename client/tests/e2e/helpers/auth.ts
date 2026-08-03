import type {
  APIRequestContext,
  Browser,
  BrowserContext,
  Page,
} from "@playwright/test"
import { E2E_API_URL, E2E_BASE_URL, E2E_OTP_CODE, uniqueEmail } from "./env"
import { assertTrpcOk, trpcMutation } from "./trpc"

export type E2EUser = {
  email: string
  fullName: string
}

/**
 * Create a fresh user via API OTP (stub code).
 * When called with `browserContext.request`, cookies land on the shared jar
 * for the API host — enough for SPA `credentials: "include"` calls.
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

  return { email, fullName }
}

/** New browser context with a signed-up user (cookies via context.request). */
export async function authenticatedContext(
  browser: Browser,
  opts?: { email?: string; fullName?: string }
): Promise<{ context: BrowserContext; user: E2EUser }> {
  const context = await browser.newContext({
    baseURL: E2E_BASE_URL,
  })
  const user = await signupViaApi(context.request, opts)
  return { context, user }
}

/** Fill OTP input-otp / single-digit slots. */
export async function fillOtp(page: Page, code = E2E_OTP_CODE): Promise<void> {
  const otpRoot = page
    .locator("[data-input-otp], input[autocomplete='one-time-code']")
    .first()
  if ((await otpRoot.count()) > 0) {
    await otpRoot.click()
    await page.keyboard.type(code, { delay: 30 })
    return
  }
  const digits = page.locator(
    'input[maxlength="1"], input[inputmode="numeric"]'
  )
  const n = await digits.count()
  if (n >= 6) {
    for (let i = 0; i < 6; i++) {
      await digits.nth(i).fill(code[i] ?? "")
    }
    return
  }
  await page.locator("input").last().fill(code)
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
  await page.locator('label[for="agreeToTerms"]').click()
  await page.getByRole("button", { name: "Continue", exact: true }).click()

  await page.getByRole("button", { name: /verify/i }).waitFor({
    state: "visible",
    timeout: 20_000,
  })
  await fillOtp(page, code)
  await page.getByRole("button", { name: /verify/i }).click()
  await page.waitForURL(/\/(resume-lab|discover|cover-letters)/, {
    timeout: 30_000,
  })

  return { email, fullName }
}

/** Health check — skip suite if API down. */
export async function apiReachable(
  request: APIRequestContext
): Promise<boolean> {
  try {
    const res = await request.get(`${E2E_API_URL}/health`, { timeout: 3_000 })
    return res.ok()
  } catch {
    return false
  }
}
