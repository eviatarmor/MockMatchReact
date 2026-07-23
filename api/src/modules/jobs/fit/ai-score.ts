import { z } from "zod"
import type { FitScore, JobFitStub } from "@mockmatch/schemas"
import { env } from "../../../config/env.js"
import { logger } from "../../../lib/logger.js"
import { getOpenRouter } from "../../../lib/openrouter.js"
import type { ResumeFitProfile } from "./extract-profile.js"

const aiResultSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      score: z.number(),
      fitNote: z.string().optional(),
      skills: z
        .array(
          z.object({
            label: z.string(),
            matched: z.boolean(),
          })
        )
        .optional(),
    })
  ),
})

function tierFromScore(score: number): FitScore["tier"] {
  if (score >= 85) return "strong"
  if (score >= 70) return "good"
  return "fair"
}

function clampDesc(text: string, max = 500): string {
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

export function isFitAiConfigured(): boolean {
  return Boolean(env.OPENROUTER_API_KEY)
}

/**
 * Batch AI fit for paid users only. Caller must gate on credits.
 * Returns partial map; missing ids mean failure for those jobs.
 */
export async function scoreJobsWithAi(
  profile: ResumeFitProfile,
  jobs: JobFitStub[]
): Promise<Record<string, FitScore>> {
  if (jobs.length === 0) return {}
  if (!isFitAiConfigured()) return {}

  const openRouter = getOpenRouter()
  const jobLines = jobs
    .map((j, i) => {
      const desc = clampDesc(j.description)
      return `${i + 1}. id=${j.id} | title=${j.title} | company=${j.company} | cat=${j.category ?? ""} | loc=${j.location ?? ""} | desc=${desc}`
    })
    .join("\n")

  const system = `You score job fit for a candidate. Return ONLY JSON:
{"results":[{"id":"...","score":0-100,"fitNote":"<=140 chars","skills":[{"label":"...","matched":true|false}]}]}
Rules: be strict; score 0-100 integers; skills max 4 labels from job needs vs profile; fitNote concise; no markdown.`

  const user = `PROFILE:\n${profile.compactText}\n\nJOBS:\n${jobLines}`

  try {
    const result = await openRouter.chat.send({
      chatRequest: {
        model: env.OPENROUTER_FIT_MODEL,
        temperature: 0.1,
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

    if (!raw) return {}

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      // try extract JSON object
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) return {}
      parsed = JSON.parse(match[0])
    }

    const validated = aiResultSchema.safeParse(parsed)
    if (!validated.success) {
      logger.warn({ err: validated.error.flatten() }, "fit ai schema mismatch")
      return {}
    }

    const allowed = new Set(jobs.map((j) => j.id))
    const out: Record<string, FitScore> = {}
    for (const item of validated.data.results) {
      if (!allowed.has(item.id)) continue
      const score = Math.max(0, Math.min(100, Math.round(item.score)))
      out[item.id] = {
        score,
        tier: tierFromScore(score),
        fitNote: (item.fitNote ?? "AI match estimate.").slice(0, 140),
        skills: (item.skills ?? [])
          .flatMap((s) =>
            s.label
              .split(/[,/&]/)
              .map((part) => part.trim())
              .filter(Boolean)
              .map((label) => ({
                label: label.slice(0, 80),
                matched: Boolean(s.matched),
              }))
          )
          .slice(0, 6),
        mode: "ai",
      }
    }
    return out
  } catch (error) {
    logger.error({ err: error }, "fit ai openrouter failed")
    return {}
  }
}
