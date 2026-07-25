import { createHash } from "node:crypto"
import { z } from "zod"
import type { JobSummaryStub, SummarizeJobsInput, SummarizeJobsResult } from "@mockmatch/schemas"
import { env } from "../../config/env.js"
import { logger } from "../../lib/logger.js"
import { getOpenRouter } from "../../lib/openrouter.js"
import { getRedis } from "../../lib/redis.js"

const CACHE_TTL_SEC = 7 * 24 * 60 * 60
/** Free models choke on large batches — keep small. */
const BATCH = 5
/** OpenRouter free tiers can hang; never block the mutation longer than this. */
const AI_TIMEOUT_MS = 12_000

const aiResultSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      summary: z.string(),
    })
  ),
})

function cacheKey(jobId: string, descHash: string): string {
  return `jobs:summary:v1:${jobId}:${descHash}`
}

function descHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16)
}

function clampDesc(text: string, max = 600): string {
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/** Local fallback when OpenRouter is off / fails / times out. */
export function heuristicSummary(job: JobSummaryStub): string {
  const raw = (job.description || "").replace(/\s+/g, " ").trim()
  if (!raw) {
    return `${job.title} at ${job.company}${job.location ? ` · ${job.location}` : ""}.`
  }
  const cleaned = raw.replace(/\s*\.\.\.\s*$/, "").replace(/\s*…\s*$/, "")
  const parts = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean)
  let out = parts.slice(0, 2).join(" ").trim()
  if (out.length < 40 && parts.length > 2) {
    out = parts.slice(0, 3).join(" ").trim()
  }
  if (out.length > 280) out = `${out.slice(0, 277).trimEnd()}…`
  if (!out) out = cleaned.slice(0, 280)
  if (!/[.!?]$/.test(out)) out = `${out}.`
  return out
}

function parseContent(content: unknown): string {
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && "text" in part
          ? String((part as { text?: string }).text ?? "")
          : ""
      )
      .join("")
  }
  return ""
}

async function summarizeBatchAi(
  jobs: JobSummaryStub[]
): Promise<Record<string, string>> {
  if (jobs.length === 0 || !env.OPENROUTER_API_KEY) return {}

  const openRouter = getOpenRouter()
  const jobLines = jobs
    .map((j, i) => {
      const desc = clampDesc(j.description)
      return `${i + 1}. id=${j.id} | title=${j.title} | company=${j.company} | loc=${j.location ?? ""} | cat=${j.category ?? ""} | desc=${desc}`
    })
    .join("\n")

  const system = `You write short job-card summaries for a job board. Return ONLY JSON:
{"results":[{"id":"...","summary":"..."}]}
Rules:
- One summary per job id, 1–2 sentences, max ~220 chars.
- Plain language: what the role is, key requirements or focus.
- No markdown, no bullet lists.
- Use only facts from the listing text.`

  try {
    const result = await withTimeout(
      openRouter.chat.send({
        chatRequest: {
          model: env.OPENROUTER_SUMMARY_MODEL,
          temperature: 0.2,
          stream: false,
          responseFormat: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: `JOBS:\n${jobLines}` },
          ],
        },
      }),
      AI_TIMEOUT_MS,
      "job summary"
    )

    const chat = result as {
      choices?: Array<{ message?: { content?: string | null | Array<unknown> } }>
    }
    const raw = parseContent(chat.choices?.[0]?.message?.content)
    if (!raw) {
      logger.warn("job summary empty model content")
      return {}
    }

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
      logger.warn({ err: validated.error.flatten() }, "job summary schema mismatch")
      return {}
    }

    const allowed = new Set(jobs.map((j) => j.id))
    const out: Record<string, string> = {}
    for (const item of validated.data.results) {
      if (!allowed.has(item.id)) continue
      const summary = item.summary.replace(/\s+/g, " ").trim().slice(0, 400)
      if (summary) out[item.id] = summary
    }
    return out
  } catch (error) {
    logger.warn({ err: error }, "job summary openrouter failed — using heuristic")
    return {}
  }
}

function applyFallback(job: JobSummaryStub, summaries: Record<string, string>): void {
  if (!summaries[job.id]) {
    summaries[job.id] = heuristicSummary(job)
  }
}

/**
 * Summarize jobs for Discover cards.
 * Free OpenRouter model when key set; always fills every id (heuristic if AI fails).
 * Cached in Redis (per job + description hash).
 */
export async function summarizeJobs(
  input: SummarizeJobsInput
): Promise<SummarizeJobsResult> {
  const jobs = input.jobs.map((j) => ({
    ...j,
    description: j.description.slice(0, 2000),
    title: j.title.slice(0, 300),
    company: j.company.slice(0, 200),
  }))

  if (jobs.length === 0) {
    return { summaries: {}, mode: "none" }
  }

  const redis = getRedis()
  const summaries: Record<string, string> = {}
  const need: JobSummaryStub[] = []

  for (const job of jobs) {
    const hash = descHash(job.description)
    try {
      const cached = await redis.get(cacheKey(job.id, hash))
      if (cached) {
        summaries[job.id] = cached
        continue
      }
    } catch {
      // ignore cache read errors
    }
    need.push(job)
  }

  let anyAi = false

  if (need.length > 0 && env.OPENROUTER_API_KEY) {
    for (let i = 0; i < need.length; i += BATCH) {
      const chunk = need.slice(i, i + BATCH)
      const ai = await summarizeBatchAi(chunk)
      for (const job of chunk) {
        const summary = ai[job.id]
        if (summary) {
          summaries[job.id] = summary
          anyAi = true
        } else {
          applyFallback(job, summaries)
        }
        try {
          await redis.set(
            cacheKey(job.id, descHash(job.description)),
            summaries[job.id]!,
            "EX",
            summary ? CACHE_TTL_SEC : Math.min(CACHE_TTL_SEC, 2 * 60 * 60)
          )
        } catch (error) {
          logger.warn({ err: error }, "job summary cache set failed")
        }
      }
    }
  } else if (need.length > 0) {
    for (const job of need) {
      applyFallback(job, summaries)
      try {
        await redis.set(
          cacheKey(job.id, descHash(job.description)),
          summaries[job.id]!,
          "EX",
          Math.min(CACHE_TTL_SEC, 6 * 60 * 60)
        )
      } catch {
        // ignore
      }
    }
  }

  // Hard guarantee: every requested id has a string
  for (const job of jobs) {
    applyFallback(job, summaries)
  }

  return {
    summaries,
    mode: anyAi ? "ai" : "heuristic",
  }
}
