import { z } from "zod"
import type { FitScore, JobFitStub } from "@mockmatch/schemas"
import { env } from "../../../config/env.js"
import { logger } from "../../../lib/logger.js"
import { getOpenRouter } from "../../../lib/openrouter.js"
import type { ResumeFitProfile } from "./extract-profile.js"
import { extractJobRequiredSkills } from "./job-skills.js"
import { tierFromScore } from "./tier.js"

const aiResultSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      score: z.number(),
      fitNote: z.string().optional(),
      /** Skills / requirements the job asks for (not match status). */
      skills: z
        .array(
          z.union([
            z.string(),
            z.object({
              label: z.string(),
              matched: z.boolean().optional(),
            }),
          ])
        )
        .optional(),
    })
  ),
})

function clampDesc(text: string, max = 1200): string {
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

function normalizeSkillLabel(raw: string): string | null {
  const label = raw.replace(/\s+/g, " ").trim()
  if (!label || label.length > 80) return null
  return label
}

function parseSkillList(
  skills: Array<string | { label: string; matched?: boolean }> | undefined,
  fallbackJobText: string
): FitScore["skills"] {
  const labels: string[] = []
  for (const s of skills ?? []) {
    const raw = typeof s === "string" ? s : s.label
    for (const part of raw.split(/[,/|]/)) {
      const label = normalizeSkillLabel(part)
      if (!label) continue
      if (labels.some((l) => l.toLowerCase() === label.toLowerCase())) continue
      labels.push(label)
      if (labels.length >= 6) break
    }
    if (labels.length >= 6) break
  }

  if (labels.length === 0) {
    return extractJobRequiredSkills(fallbackJobText, 6)
  }

  return labels.map((label) => ({ label, matched: false }))
}

export function isFitAiConfigured(): boolean {
  return Boolean(env.OPENROUTER_API_KEY)
}

/**
 * Batch AI fit. Caller gates credits / config.
 * Skills = what the job needs (not resume match tags).
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
{"results":[{"id":"...","score":0-100,"fitNote":"<=140 chars","skills":["skill1","skill2"]}]}
Rules:
- score 0-100 integers; be strict (poor fits should score under 40).
- skills: up to 6 skills or requirements the JOB needs (tools, languages, domain) — NOT whether the candidate has them.
- fitNote: short reason for the score; no markdown.`

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
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) return {}
      parsed = JSON.parse(match[0])
    }

    const validated = aiResultSchema.safeParse(parsed)
    if (!validated.success) {
      logger.warn({ err: validated.error.flatten() }, "fit ai schema mismatch")
      return {}
    }

    const byId = new Map(jobs.map((j) => [j.id, j]))
    const allowed = new Set(jobs.map((j) => j.id))
    const out: Record<string, FitScore> = {}
    for (const item of validated.data.results) {
      if (!allowed.has(item.id)) continue
      const score = Math.max(0, Math.min(100, Math.round(item.score)))
      const job = byId.get(item.id)
      const fallbackText = job
        ? [job.title, job.company, job.category ?? "", job.description].join(" ")
        : ""
      out[item.id] = {
        score,
        tier: tierFromScore(score),
        fitNote: (item.fitNote ?? "AI match estimate.").slice(0, 140),
        skills: parseSkillList(item.skills, fallbackText),
        mode: "ai",
      }
    }
    return out
  } catch (error) {
    logger.error({ err: error }, "fit ai openrouter failed")
    return {}
  }
}
