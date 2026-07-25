import { randomUUID } from "node:crypto"
import { env } from "../../../config/env.js"
import { logger } from "../../../lib/logger.js"
import { getOpenRouter } from "../../../lib/openrouter.js"

export function isFitDocAiConfigured(): boolean {
  return Boolean(env.OPENROUTER_API_KEY)
}

function stripJsonFences(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced?.[1]?.trim() ?? trimmed
}

function extractJsonObject(raw: string): string {
  const stripped = stripJsonFences(raw)
  const start = stripped.indexOf("{")
  const end = stripped.lastIndexOf("}")
  if (start === -1 || end <= start) return stripped
  return stripped.slice(start, end + 1)
}

function repairJsonLoose(text: string): string {
  return text
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
}

export function parseModelJson(raw: string): unknown {
  const candidates = [
    stripJsonFences(raw),
    extractJsonObject(raw),
    repairJsonLoose(extractJsonObject(raw)),
  ]
  let lastError: unknown
  for (const candidate of candidates) {
    if (!candidate.trim()) continue
    try {
      return JSON.parse(candidate) as unknown
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error("JSON parse failed")
}

export function ensureId(value: unknown): string {
  return typeof value === "string" && value.length > 0 ? value : randomUUID()
}

export function ensureIdsDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ensureIdsDeep)
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>
    const next: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(obj)) {
      next[key] = key === "id" ? ensureId(child) : ensureIdsDeep(child)
    }
    if (!("id" in next) && "type" in next) {
      next.id = randomUUID()
    }
    return next
  }
  return value
}

export async function chatJsonObject(
  system: string,
  user: string
): Promise<unknown> {
  const openRouter = getOpenRouter()
  const result = await openRouter.chat.send({
    chatRequest: {
      model: env.OPENROUTER_FIT_DOC_MODEL,
      temperature: 0.25,
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
    logger.warn("fit-doc model returned empty content")
    throw new Error("Empty model response")
  }

  return parseModelJson(raw)
}
