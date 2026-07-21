import { Hono, type Context } from "hono"
import { TRPCError } from "@trpc/server"
import { env } from "../../config/env.js"
import { db } from "../../db/client.js"
import { getAccessTokenFromCookie } from "../../lib/cookies.js"
import { signPrintAccessToken, verifyAccessToken } from "../../lib/jwt.js"
import { logger } from "../../lib/logger.js"
import { PdfBusyError, PdfRenderError, renderPrintPdf } from "../../lib/pdf-print.js"
import { getCoverLetter } from "../cover-letters/service.js"
import { getResume } from "../resumes/service.js"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function extractBearer(authorization: string | undefined): string | null {
  if (!authorization?.startsWith("Bearer ")) return null
  return authorization.slice("Bearer ".length).trim() || null
}

function sanitizeFilename(title: string, fallback: string): string {
  const stem = title
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80)
  const base = stem || fallback
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`
}

async function resolveUser(c: Context): Promise<{ id: string; email: string } | null> {
  const cookieToken = getAccessTokenFromCookie(c)
  const headerToken = extractBearer(c.req.header("authorization"))
  const token = cookieToken || headerToken
  if (!token) return null
  try {
    const payload = await verifyAccessToken(token)
    return { id: payload.sub, email: String(payload.email ?? "") }
  } catch {
    return null
  }
}

async function handleExport(c: Context, kind: "resume" | "cover-letter") {
  const user = await resolveUser(c)
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const rawId = c.req.param("id")
  if (!rawId || !UUID_RE.test(rawId)) {
    return c.json({ error: "Invalid id" }, 400)
  }
  const id = rawId

  let title: string
  let printPath: string
  let fallbackName: string

  try {
    if (kind === "resume") {
      const doc = await getResume(db, user.id, id)
      title = doc.title
      printPath = `/resumes/${id}/print`
      fallbackName = "resume"
    } else {
      const doc = await getCoverLetter(db, user.id, id)
      title = doc.title
      printPath = `/cover-letters/${id}/print`
      fallbackName = "cover-letter"
    }
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      return c.json({ error: "Not found" }, 404)
    }
    logger.error({ err: error, kind, id }, "export_pdf_lookup_failed")
    return c.json({ error: "PDF export failed" }, 500)
  }

  try {
    const accessToken = await signPrintAccessToken({
      userId: user.id,
      email: user.email,
    })
    const url = new URL(printPath, env.APP_URL).toString()
    const pdf = await renderPrintPdf({ url, accessToken })
    const filename = sanitizeFilename(title, fallbackName)

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof PdfBusyError) {
      return c.json({ error: error.message }, 503)
    }
    if (error instanceof PdfRenderError) {
      return c.json({ error: error.message }, 502)
    }
    logger.error({ err: error, kind, id }, "export_pdf_failed")
    return c.json({ error: "PDF export failed" }, 500)
  }
}

export const exportRoutes = new Hono()

exportRoutes.get("/resumes/:id/pdf", (c) => handleExport(c, "resume"))
exportRoutes.get("/cover-letters/:id/pdf", (c) => handleExport(c, "cover-letter"))
