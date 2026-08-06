import { test, expect, type Page } from "@playwright/test"
import {
  E2E_SKIP,
  apiReachable,
  authenticatedContext,
} from "./helpers"

/**
 * Authenticated route matrix — each path should render app chrome without
 * bouncing to /login (RequireAuth + cookies).
 */
const DASHBOARD_PATHS = [
  "/resume-lab",
  "/cover-letters",
  "/discover",
  "/applications",
  "/simulations",
  "/question-bank",
  "/custom-questions",
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
  await page.waitForLoadState("domcontentloaded")
  await expect(page).not.toHaveURL(/\/login/, { timeout: 25_000 })
  await expect(page.locator("body")).toBeVisible()
  await page.waitForTimeout(500)
  expect(page.url().includes("/login")).toBe(false)
}

test.describe("authenticated dashboard routes", () => {
  test.skip(E2E_SKIP, "E2E_SKIP=1")

  test.beforeEach(async ({ request }) => {
    test.skip(!(await apiReachable(request)), "API not reachable at E2E_API_URL")
  })

  for (const path of DASHBOARD_PATHS) {
    test(`loads ${path}`, async ({ browser }) => {
      const { context } = await authenticatedContext(browser)
      const page = await context.newPage()
      try {
        await expectAuthenticatedShell(page, path)
      } finally {
        await context.close()
      }
    })
  }

  test("resume lab can open templates route", async ({ browser }) => {
    const { context } = await authenticatedContext(browser)
    const page = await context.newPage()
    try {
      await page.goto("/resume-lab/templates")
      await expect(page).not.toHaveURL(/\/login/, { timeout: 25_000 })
      await expect(page.locator("body")).toBeVisible()
    } finally {
      await context.close()
    }
  })

  test("cover letter templates route", async ({ browser }) => {
    const { context } = await authenticatedContext(browser)
    const page = await context.newPage()
    try {
      await page.goto("/cover-letters/templates")
      await expect(page).not.toHaveURL(/\/login/, { timeout: 25_000 })
    } finally {
      await context.close()
    }
  })
})
