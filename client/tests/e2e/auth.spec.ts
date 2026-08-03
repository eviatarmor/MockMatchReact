import { test, expect } from "@playwright/test"
import {
  E2E_SKIP,
  apiReachable,
  signupViaApi,
  signupViaUi,
  uniqueEmail,
} from "./helpers"

test.describe("auth flows", () => {
  test.skip(E2E_SKIP, "E2E_SKIP=1")

  test.beforeEach(async ({ request }) => {
    test.skip(!(await apiReachable(request)), "API not reachable at E2E_API_URL")
  })

  test("API signup + cookies → authenticated me", async ({ request }) => {
    const user = await signupViaApi(request)
    expect(user.email).toContain("@")

    // Cookies should allow auth.me
    const res = await request.get(
      `${process.env.E2E_API_URL ?? "http://localhost:3000"}/trpc/auth.me`
    )
    // tRPC query may need input param; 401 without cookie is failure
    expect(res.status()).not.toBe(401)
  })

  test("UI signup with OTP stub lands on dashboard", async ({ page }) => {
    const email = uniqueEmail("ui-signup")
    await signupViaUi(page, { email, fullName: "Playwright User" })
    await expect(page).toHaveURL(/\/resume-lab|\/discover|\/cover-letters/)
    // Shell should show something beyond blank
    await expect(page.locator("body")).not.toBeEmpty()
  })

  test("login for existing user via UI OTP", async ({ page, request }) => {
    const email = uniqueEmail("ui-login")
    await signupViaApi(request, { email, fullName: "Login User" })

    // Fresh page without API request cookies — pure UI login
    await page.goto("/login")
    await page.locator("#email").fill(email)
    await page.getByRole("button", { name: "Continue", exact: true }).click()
    await page.getByRole("button", { name: /verify/i }).waitFor({
      state: "visible",
      timeout: 20_000,
    })

    const code = process.env.E2E_OTP_CODE ?? "000000"
    const otpRoot = page
      .locator("[data-input-otp], input[autocomplete='one-time-code']")
      .first()
    if (await otpRoot.count()) {
      await otpRoot.click()
      await page.keyboard.type(code, { delay: 30 })
    } else {
      const digits = page.locator('input[maxlength="1"], input[inputmode="numeric"]')
      const n = await digits.count()
      if (n >= 6) {
        for (let i = 0; i < 6; i++) await digits.nth(i).fill(code[i]!)
      }
    }
    await page.getByRole("button", { name: /verify/i }).click()
    await page.waitForURL(/\/(resume-lab|discover|cover-letters)/, {
      timeout: 30_000,
    })
  })
})
