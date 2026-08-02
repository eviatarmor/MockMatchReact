import { env } from "../../config/env.js"
import { logger } from "../../lib/logger.js"
import { getOpenRouter } from "../../lib/openrouter.js"
import { parseModelJson } from "../jobs/fit-doc/openrouter-json.js"

export async function chatJsonWithModel(
  model: string,
  system: string,
  user: string,
  temperature = 0.3
): Promise<unknown> {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured")
  }

  const openRouter = getOpenRouter()
  const result = await openRouter.chat.send({
    chatRequest: {
      model,
      temperature,
      stream: false,
      responseFormat: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
  })

  const chat = result as {
    choices?: Array<{ message?: { content?: string | null | Array<unknown> } }>
  }
  const content = chat.choices?.[0]?.message?.content
  const raw =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content
            .map((part) =>
              part && typeof part === "object" && "text" in part
                ? String((part as { text?: string }).text ?? "")
                : ""
            )
            .join("")
        : ""

  if (!raw) {
    logger.warn({ model }, "question_gen_empty_model_response")
    throw new Error("Empty model response")
  }

  return parseModelJson(raw)
}
