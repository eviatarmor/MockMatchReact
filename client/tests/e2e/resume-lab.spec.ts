import { test, expect } from "@playwright/test"
import {
  E2E_SKIP,
  apiReachable,
  authenticatedContext,
  trpcMutationData,
  trpcQueryData,
} from "./helpers"

test.describe("resume lab create → edit → list", () => {
  test.skip(E2E_SKIP, "E2E_SKIP=1")

  test.beforeEach(async ({ request }) => {
    test.skip(!(await apiReachable(request)), "API not reachable")
  })

  test("API create → open editor → list shows resume", async ({ browser }) => {
    const { context } = await authenticatedContext(browser)
    const apiRequest = context.request

    const created = await trpcMutationData<
      { title?: string },
      { id: string; title: string }
    >(apiRequest, "resumes.create", {
      title: "E2E Resume Title",
    })
    expect(created.id).toBeTruthy()
    expect(created.title).toContain("E2E Resume")

    const page = await context.newPage()
    try {
      await page.goto(`/resumes/${created.id}`)
      await expect(page).not.toHaveURL(/\/login/, { timeout: 25_000 })
      await expect(page).toHaveURL(new RegExp(`/resumes/${created.id}`))
      await expect(page.locator("body")).toBeVisible()
      await page.waitForTimeout(800)

      await page.goto("/resume-lab")
      await expect(page).not.toHaveURL(/\/login/, { timeout: 25_000 })
      await expect(
        page.getByText("E2E Resume Title", { exact: false }).first()
      ).toBeVisible({ timeout: 20_000 })
    } finally {
      await context.close()
    }
  })

  test("UI New resume navigates to editor then list", async ({ browser }) => {
    const { context } = await authenticatedContext(browser)
    const page = await context.newPage()
    try {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto("/resume-lab")
      await expect(page).not.toHaveURL(/\/login/, { timeout: 25_000 })

      const newBtn = page.getByRole("button", { name: /new resume/i })
      await expect(newBtn).toBeVisible({ timeout: 15_000 })
      await newBtn.click()

      await page.waitForURL(/\/resumes\/[0-9a-f-]{36}/i, { timeout: 30_000 })
      const m = page.url().match(/\/resumes\/([0-9a-f-]{36})/i)
      expect(m?.[1]).toBeTruthy()
      const resumeId = m![1]!

      await page.goto("/resume-lab")
      await expect(page).toHaveURL(/\/resume-lab/)
      await page.waitForTimeout(500)
      const listed = await trpcQueryData<{
        items: { id: string }[]
      }>(context.request, "resumes.list", { page: 1, pageSize: 20 })
      expect(listed.items.some((i) => i.id === resumeId)).toBe(true)
    } finally {
      await context.close()
    }
  })

  test("create → update title via API → list reflects title", async ({
    browser,
  }) => {
    const { context } = await authenticatedContext(browser)
    try {
      const created = await trpcMutationData<
        { title: string },
        { id: string }
      >(context.request, "resumes.create", { title: "Before Edit" })

      await trpcMutationData(context.request, "resumes.update", {
        id: created.id,
        title: "After Edit Title",
      })

      const listed = await trpcQueryData<{
        items: { id: string; title: string }[]
      }>(context.request, "resumes.list", { page: 1, pageSize: 50 })

      const row = listed.items.find((i) => i.id === created.id)
      expect(row?.title).toBe("After Edit Title")
    } finally {
      await context.close()
    }
  })
})
