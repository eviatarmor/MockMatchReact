import { chromium, type Browser } from "playwright"
import { env } from "../config/env.js"
import { ACCESS_COOKIE } from "./cookies.js"
import { logger } from "./logger.js"

const MAX_CONCURRENT = 1

let activeRenders = 0
let browserPromise: Promise<Browser> | null = null

export class PdfBusyError extends Error {
  constructor() {
    super("PDF export is busy. Try again in a moment.")
    this.name = "PdfBusyError"
  }
}

export class PdfRenderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = "PdfRenderError"
  }
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium
      .launch({
        headless: true,
        executablePath: env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      })
      .catch((error) => {
        browserPromise = null
        throw error
      })
  }
  return browserPromise
}

/**
 * Open a print URL in headless Chromium with an access cookie, wait for
 * `html[data-print-ready="true"]`, and return a PDF buffer (US Letter).
 */
export async function renderPrintPdf(input: {
  readonly url: string
  readonly accessToken: string
  readonly timeoutMs?: number
}): Promise<Buffer> {
  if (activeRenders >= MAX_CONCURRENT) {
    throw new PdfBusyError()
  }

  activeRenders += 1
  const timeout = input.timeoutMs ?? env.PDF_EXPORT_TIMEOUT_MS

  let context: Awaited<ReturnType<Browser["newContext"]>> | null = null
  try {
    const browser = await getBrowser()
    context = await browser.newContext({
      viewport: { width: 900, height: 1200 },
      deviceScaleFactor: 1,
    })

    // Cookie must be scoped to the API origin — the SPA print page calls
    // tRPC with credentials:include against API_URL (not APP_URL).
    await context.addCookies([
      {
        name: ACCESS_COOKIE,
        value: input.accessToken,
        url: env.API_URL,
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "Lax",
      },
    ])

    const page = await context.newPage()
    page.setDefaultTimeout(timeout)

    await page.goto(input.url, { waitUntil: "networkidle", timeout })
    await page.waitForSelector('html[data-print-ready="true"]', { timeout })
    // String form avoids needing DOM lib types in the API tsconfig.
    await page.evaluate(`
      (async () => {
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready
        }
      })()
    `)

    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      preferCSSPageSize: true,
    })

    return Buffer.from(pdf)
  } catch (error) {
    if (error instanceof PdfBusyError) throw error
    logger.error({ err: error, url: input.url }, "pdf_print_failed")
    const message =
      error instanceof Error && /Executable doesn't exist|browserType\.launch/i.test(error.message)
        ? "PDF engine not installed. Run: npx playwright install chromium"
        : error instanceof Error
          ? error.message
          : "PDF render failed"
    throw new PdfRenderError(message, { cause: error })
  } finally {
    activeRenders = Math.max(0, activeRenders - 1)
    if (context) {
      await context.close().catch(() => undefined)
    }
  }
}

/** Close the shared browser (graceful shutdown). */
export async function closePdfBrowser(): Promise<void> {
  if (!browserPromise) return
  try {
    const browser = await browserPromise
    await browser.close()
  } catch {
    // ignore
  } finally {
    browserPromise = null
  }
}
