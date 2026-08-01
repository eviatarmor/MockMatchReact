import { Hono } from "hono"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { env } from "../../config/env.js"
import { db } from "../../db/client.js"
import { voiceSessions } from "../../db/schema/voice-sessions.js"

/**
 * Server-to-server routes for Pipecat workers (shared secret, not user JWT).
 */
export const voiceInternalRoutes = new Hono()

voiceInternalRoutes.use("*", async (c, next) => {
  const auth = c.req.header("Authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!env.VOICE_WORKER_SECRET || token !== env.VOICE_WORKER_SECRET) {
    return c.json({ error: "unauthorized" }, 401)
  }
  await next()
})

const transcriptBody = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  transcript: z.array(
    z.object({
      id: z.string(),
      role: z.string(),
      text: z.string(),
      at: z.number().optional(),
    })
  ),
  final: z.boolean().default(false),
  status: z.string().optional(),
})

voiceInternalRoutes.post("/internal/transcript", async (c) => {
  const parsed = transcriptBody.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: "invalid_body", details: parsed.error.flatten() }, 400)
  }
  const body = parsed.data

  const [row] = await db
    .select()
    .from(voiceSessions)
    .where(eq(voiceSessions.id, body.sessionId))
    .limit(1)

  if (!row || row.userId !== body.userId) {
    return c.json({ error: "not_found" }, 404)
  }

  const patch: Record<string, unknown> = {
    transcript: body.transcript,
    updatedAt: new Date(),
  }
  if (body.final) {
    patch.status = body.status === "error" ? "error" : "ended"
    patch.endedAt = new Date()
  } else if (row.status === "ready" || row.status === "pending") {
    patch.status = "active"
  }

  await db
    .update(voiceSessions)
    .set(patch)
    .where(eq(voiceSessions.id, body.sessionId))

  return c.json({ ok: true })
})
