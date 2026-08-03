import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173"

/**
 * Comprehensive Playwright E2E for the web client.
 *
 * Requires:
 *   - client at E2E_BASE_URL (default :5173)
 *   - api at E2E_API_URL (default :3000) with OTP_STUB_CODE for auth specs
 *   - Postgres + Redis up for signup/login
 *
 * Skip all: E2E_SKIP=1
 * Install browser once: npx playwright install chromium
 */
export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Full monorepo boot is external (`npm run dev`). Do not auto webServer here.
})
