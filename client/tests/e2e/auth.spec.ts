import { test, expect } from "@playwright/test"
import {
  E2E_SKIP,
  apiReachable,
  fillOtp,
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

    const res = await request.get(
      `${process.env.E2E_API_URL ?? "http://localhost:3000"}/trpc/auth.me`
    )
    expect(res.status()).not.toBe(401)
  })

  test("UI signup with OTP stub lands on dashboard", async ({ page }) => {
    const email = uniqueEmail("ui-signup")
    await signupViaUi(page, { email, fullName: "Playwright User" })
    await expect(page).toHaveURL(/\/(resume-lab|discover|cover-letters)/)
    await expect(
      page.getByRole("navigation").or(page.locator("main")).first()
    ).toBeVisible()
  })

  test("login for existing user via UI OTP", async ({ page, request }) => {
    const email = uniqueEmail("ui-login")
    await signupViaApi(request, { email, fullName: "Login User" })

    await page.goto("/login")
    await page.locator("#email").fill(email)
    await page.getByRole("button", { name: "Continue", exact: true }).click()
    await page.getByRole("button", { name: /verify/i }).waitFor({
      state: "visible",
      timeout: 20_000,
    })

    await fillOtp(page)
    await page.getByRole("button", { name: /verify/i }).click()
    await page.waitForURL(/\/(resume-lab|discover|cover-letters)/, {
      timeout: 30_000,
    })
  })
})
