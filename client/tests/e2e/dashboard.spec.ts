import { test, expect, type BrowserContext, type Page } from "@playwright/test"
import {
  E2E_SKIP,
  apiReachable,
  authenticatedContext,
} from "./helpers"

/**
 * Authenticated route matrix — each path should render app chrome without
 * bouncing to /login (RequireAuth + cookies).
 *
 * One signup per suite (not per path).
 */
const DASHBOARD_PATHS = [
  "/resume-lab",
  "/cover-letters",
  "/discover",
  "/applications",
  "/simulations",
  "/question-bank",
  "/readiness",
  "/performance",
  "/autofill",
  "/help",
  "/account-settings",
  "/billing",
  "/privacy",
] as const

async function expectAuthenticatedShell(page: Page, path: string) {
  await page.goto(path)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 25_000 })
  // App chrome: sidebar/nav or main content region (not a blank body)
  await expect(
    page
      .getByRole("navigation")
      .or(page.locator("main"))
      .or(page.getByRole("banner"))
      .first()
  ).toBeVisible({ timeout: 25_000 })
}

test.describe("authenticated dashboard routes", () => {
  test.skip(E2E_SKIP, "E2E_SKIP=1")

  let context: BrowserContext
  let page: Page

  test.beforeAll(async ({ browser, request }) => {
    test.skip(!(await apiReachable(request)), "API not reachable at E2E_API_URL")
    const auth = await authenticatedContext(browser)
    context = auth.context
    page = await context.newPage()
  })

  test.afterAll(async () => {
    await context?.close()
  })

  for (const path of DASHBOARD_PATHS) {
    test(`loads ${path}`, async () => {
      await expectAuthenticatedShell(page, path)
    })
  }

  test("resume lab can open templates route", async () => {
    await page.goto("/resume-lab/templates")
    await expect(page).not.toHaveURL(/\/login/, { timeout: 25_000 })
    await expect(
      page.getByRole("navigation").or(page.locator("main")).first()
    ).toBeVisible()
  })

  test("cover letter templates route", async () => {
    await page.goto("/cover-letters/templates")
    await expect(page).not.toHaveURL(/\/login/, { timeout: 25_000 })
  })
})
