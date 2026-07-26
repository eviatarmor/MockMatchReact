import { Hono, type Context } from "hono"
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { env } from "../../config/env.js"
import { getAccessTokenFromCookie } from "../../lib/cookies.js"
import { verifyAccessToken } from "../../lib/jwt.js"
import { logger } from "../../lib/logger.js"
import { buildAskSystemPrompt } from "./system-prompt.js"

function extractBearer(authorization: string | undefined): string | null {
  if (!authorization?.startsWith("Bearer ")) return null
  return authorization.slice("Bearer ".length).trim() || null
}

async function resolveUser(
  c: Context
): Promise<{ id: string; email: string } | null> {
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

export const askRoutes = new Hono()

askRoutes.post("/chat", async (c) => {
  const user = await resolveUser(c)
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  if (!env.OPENROUTER_API_KEY) {
    return c.json(
      { error: "Ask is not configured (missing OPENROUTER_API_KEY)." },
      503
    )
  }

  let body: { messages?: UIMessage[] }
  try {
    body = (await c.req.json()) as { messages?: UIMessage[] }
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400)
  }

  const messages = body.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "messages required" }, 400)
  }

  // Cap history so free models stay within context / cost bounds.
  const recent = messages.slice(-24)

  try {
    const openrouter = createOpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
      appName: "MockMatch Ask",
      appUrl: env.APP_URL,
    })

    const modelMessages = await convertToModelMessages(recent)

    const result = streamText({
      model: openrouter.chat(env.OPENROUTER_ASK_MODEL),
      system: buildAskSystemPrompt(),
      messages: modelMessages,
      temperature: 0.4,
    })

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
    })
  } catch (error) {
    logger.error({ err: error, userId: user.id }, "ask_chat_failed")
    return c.json({ error: "Ask request failed" }, 500)
  }
})
