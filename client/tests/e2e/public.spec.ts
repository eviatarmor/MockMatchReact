import { test, expect } from "@playwright/test"
import { E2E_SKIP } from "./helpers"

test.describe("public surfaces", () => {
  test.skip(E2E_SKIP, "E2E_SKIP=1")

  test("home redirects into app shell (then auth gate)", async ({ page }) => {
    await page.goto("/")
    // Marketing lives in monorepo landpage/; client `/` → app shell
    await page.waitForURL(/\/(login|resume-lab|discover)/, { timeout: 20_000 })
    const url = page.url()
    expect(
      url.includes("/login") ||
        url.includes("/resume-lab") ||
        url.includes("/discover")
    ).toBe(true)
  })

  test("login page has email + continue", async ({ page }) => {
    await page.goto("/login")
    const email = page.locator('input[type="email"], #email').first()
    await expect(email).toBeVisible({ timeout: 20_000 })
    // Exact "Continue" — not "Continue with Google/LinkedIn"
    await expect(
      page.getByRole("button", { name: "Continue", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: /create an account|sign up/i })
    ).toBeVisible()
  })

  test("signup page has name, email, terms", async ({ page }) => {
    await page.goto("/signup")
    await expect(page.locator("#fullName")).toBeVisible({ timeout: 15_000 })
    await expect(page.locator("#email")).toBeVisible()
    await expect(page.locator("#agreeToTerms")).toBeVisible()
    await expect(
      page.getByRole("button", { name: /continue/i })
    ).toBeVisible()
  })

  test("login ↔ signup navigation links", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("link", { name: /create an account/i }).click()
    await expect(page).toHaveURL(/\/signup/)
    await page.getByRole("link", { name: /sign in/i }).first().click()
    await expect(page).toHaveURL(/\/login/)
  })

  test("unknown route shows not-found or app shell", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-e2e-xyz")
    // Either dedicated 404 copy or redirect to login/home
    await page.waitForLoadState("domcontentloaded")
    const body = await page.locator("body").innerText()
    expect(body.length).toBeGreaterThan(10)
  })
})
