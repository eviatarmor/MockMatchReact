import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { eq } from "drizzle-orm"
import { getRedis } from "../../lib/redis.js"
import { getAccessTokenFromCookie } from "../../lib/cookies.js"
import { verifyAccessToken } from "../../lib/jwt.js"
import { voiceEventsChannel } from "../../lib/voice-store.js"
import { db } from "../../db/client.js"
import { voiceSessions } from "../../db/schema/voice-sessions.js"

/**
 * SSE stream of voice session events (agent_state, transcript).
 * Auth: access cookie or Authorization Bearer.
 */
export const voiceEventRoutes = new Hono()

voiceEventRoutes.get("/sessions/:sessionId/events", async (c) => {
  const sessionId = c.req.param("sessionId")
  const cookieToken = getAccessTokenFromCookie(c)
  const headerToken = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "")
  const auth = cookieToken || headerToken || c.req.query("token") || ""

  if (!auth) {
    return c.json({ error: "unauthorized" }, 401)
  }

  let userId: string
  try {
    const payload = await verifyAccessToken(auth)
    userId = payload.sub
  } catch {
    return c.json({ error: "unauthorized" }, 401)
  }

  const [row] = await db
    .select()
    .from(voiceSessions)
    .where(eq(voiceSessions.id, sessionId))
    .limit(1)

  if (!row || row.userId !== userId) {
    return c.json({ error: "not_found" }, 404)
  }

  const redis = getRedis()
  const sub = redis.duplicate()
  const channel = voiceEventsChannel(sessionId)

  return streamSSE(c, async (stream) => {
    await sub.subscribe(channel)

    const onMessage = (ch: string, message: string) => {
      if (ch !== channel) return
      void stream.writeSSE({ data: message, event: "voice" })
    }

    sub.on("message", onMessage)

    await stream.writeSSE({
      event: "voice",
      data: JSON.stringify({
        type: "session_status",
        status: row.status,
        sessionId,
      }),
    })

    const keepAlive = setInterval(() => {
      void stream.writeSSE({ event: "ping", data: "{}" })
    }, 15_000)

    try {
      await new Promise<void>((resolve) => {
        c.req.raw.signal.addEventListener("abort", () => resolve())
      })
    } finally {
      clearInterval(keepAlive)
      sub.off("message", onMessage)
      await sub.unsubscribe(channel)
      await sub.quit()
    }
  })
})
