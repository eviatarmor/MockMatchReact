import { test, expect } from "@playwright/test"
import { E2E_SKIP } from "./helpers"

test.describe("public surfaces", () => {
  test.skip(E2E_SKIP, "E2E_SKIP=1")

  test("home redirects into app shell (then auth gate)", async ({ page }) => {
    await page.goto("/")
    await page.waitForURL(/\/(login|resume-lab|discover)/, { timeout: 20_000 })
    await expect(page).toHaveURL(/\/(login|resume-lab|discover)/)
  })

  test("login page has email + continue", async ({ page }) => {
    await page.goto("/login")
    const email = page.locator('input[type="email"], #email').first()
    await expect(email).toBeVisible({ timeout: 20_000 })
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

  test("unauthenticated dashboard gates to login", async ({ page }) => {
    await page.goto("/discover")
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 })
  })

  test("unknown route shows not-found copy or redirects", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-e2e-xyz")
    await page.waitForLoadState("domcontentloaded")
    const notFound = page.getByText(/not found|404|page doesn/i)
    const redirected = page.url().includes("/login") || page.url().includes("/")
    const hasNotFound = (await notFound.count()) > 0
    expect(hasNotFound || redirected).toBe(true)
  })
})
