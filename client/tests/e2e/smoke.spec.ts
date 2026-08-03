import { test, expect } from "@playwright/test"
import { E2E_SKIP } from "./helpers"

/**
 * Fast smoke subset (also covered in public.spec / dashboard.spec).
 * Kept for a short default path: `npx playwright test smoke`
 */
test.describe("smoke", () => {
  test.skip(E2E_SKIP, "E2E_SKIP=1")

  test("login page renders", async ({ page }) => {
    await page.goto("/login")
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator("#email")).toBeVisible({ timeout: 15_000 })
  })

  test("signup page renders", async ({ page }) => {
    await page.goto("/signup")
    await expect(page).toHaveURL(/\/signup/)
    await expect(page.locator("#email")).toBeVisible({ timeout: 15_000 })
  })

  test("unauthenticated dashboard gates to login", async ({ page }) => {
    await page.goto("/discover")
    await page.waitForURL(/\/(login|discover)/, { timeout: 20_000 })
    const url = page.url()
    expect(url.includes("/login") || url.includes("/discover")).toBe(true)
  })
})
