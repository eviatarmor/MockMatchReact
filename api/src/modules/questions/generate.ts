import { z } from "zod"
import { env } from "../../config/env.js"
import type { Database } from "../../db/client.js"
import {
  questions,
  type QuestionPayload,
} from "../../db/schema/questions.js"
import { trackedJobs } from "../../db/schema/tracked-jobs.js"
import { and, eq, inArray } from "drizzle-orm"
import { spendCredits } from "../billing/credits.js"
import {
  buildContentHash,
  buildSearchDocument,
  dedupeCandidate,
} from "./dedupe.js"
import { chatJsonWithModel } from "./openrouter-json.js"
import { logger } from "../../lib/logger.js"

const GENERATOR_ALLOWLIST = new Set([
  "moonshotai/kimi-k3",
  "moonshotai/kimi-k2.6",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "anthropic/claude-sonnet-4",
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4.1",
  "openai/gpt-4o",
  "openai/gpt-oss-20b:free",
  "google/gemma-4-26b-a4b-it:free",
])

const routerSchema = z.object({
  generatorModel: z.string().optional(),
  roleFamily: z.string().optional(),
  mix: z
    .array(
      z.object({
        format: z.enum(["conversation", "code_run"]),
        domain: z.enum([
          "coding",
          "systemDesign",
          "caseStudy",
          "product",
          "behavioral",
          "finance",
          "clinical",
        ]),
        difficulty: z.enum(["easy", "medium", "hard"]),
        count: z.number().int().min(1).max(6),
        language: z.string().optional(),
        trackHint: z.string().optional(),
      })
    )
    .min(1)
    .max(8),
  rationale: z.string().optional(),
})

const generatedItemSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().min(1).max(8000),
  domain: z.enum([
    "coding",
    "systemDesign",
    "caseStudy",
    "product",
    "behavioral",
    "finance",
    "clinical",
  ]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  format: z.enum(["conversation", "code_run"]),
  language: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  roleFamilies: z.array(z.string()).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
})

const generatedBatchSchema = z.object({
  questions: z.array(generatedItemSchema).min(1).max(20),
})

export type GenerateFromJobsResult =
  | {
      ok: true
      created: number
      skippedExact: number
      skippedNear: number
      questions: Array<{ id: string; title: string; format: string }>
      generatorModel: string
      routerModel: string
      creditsCharged: number
    }
  | {
      ok: false
      code:
        | "not_configured"
        | "insufficient_credits"
        | "no_jobs"
        | "router_failed"
        | "generator_failed"
      message: string
      remaining?: number
    }

function clampDesc(text: string, max = 4000): string {
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

function resolveGeneratorModel(requested?: string): string {
  if (requested && GENERATOR_ALLOWLIST.has(requested)) return requested
  if (
    requested &&
    (requested.includes("kimi") ||
      requested.includes("gemini") ||
      requested.includes("claude") ||
      requested.includes("gpt"))
  ) {
    return requested
  }
  return env.OPENROUTER_QUESTION_GENERATOR_MODEL
}

const SAFE_TRACK_HINTS = new Set([
  "behavioral-core",
  "product-sense",
  "system-design-talk",
])

function safeTrackHint(
  domain: string,
  hint?: string | null
): "behavioral-core" | "product-sense" | "system-design-talk" {
  if (hint && SAFE_TRACK_HINTS.has(hint)) {
    return hint as "behavioral-core" | "product-sense" | "system-design-talk"
  }
  if (domain === "product") return "product-sense"
  if (domain === "systemDesign") return "system-design-talk"
  return "behavioral-core"
}

function defaultPayload(
  format: "conversation" | "code_run",
  item: z.infer<typeof generatedItemSchema>
): QuestionPayload {
  if (format === "conversation") {
    const fromPayload = (item.payload ?? {}) as { trackHint?: string }
    return {
      interviewerPrompt: item.body,
      followUps: [],
      ...(item.payload ?? {}),
      trackHint: safeTrackHint(
        item.domain,
        fromPayload.trackHint ?? item.payload?.trackHint as string | undefined
      ),
    }
  }
  const language = item.language ?? "javascript"
  const fromPayload = (item.payload ?? {}) as Record<string, unknown>
  const entryPath =
    typeof fromPayload.entryPath === "string"
      ? fromPayload.entryPath
      : language.includes("py")
        ? "main.py"
        : language.includes("ts")
          ? "main.ts"
          : language.includes("cpp")
            ? "main.cpp"
            : "main.js"
  const defaultStarter =
    language.includes("py")
      ? `# ${item.title}\n# TODO: implement\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n`
      : `// ${item.title}\n// TODO: implement\n\nfunction solve() {\n  // …\n}\n\nsolve()\n`
  const starterCode =
    typeof fromPayload.starterCode === "string" && fromPayload.starterCode.trim()
      ? fromPayload.starterCode
      : defaultStarter
  const files =
    fromPayload.files &&
    typeof fromPayload.files === "object" &&
    Object.keys(fromPayload.files as object).length > 0
      ? (fromPayload.files as Record<string, string>)
      : { [entryPath]: starterCode }
  return {
    ...fromPayload,
    prompt: item.body,
    language,
    starterCode,
    entryPath,
    files,
    tests: Array.isArray(fromPayload.tests) ? fromPayload.tests : [],
  }
}

function contentCacheFromPayload(
  format: string,
  payload: QuestionPayload
): Record<string, string> {
  if (format !== "code_run" && format !== "workspace") return {}
  const p = payload as {
    files?: Record<string, string>
    starterCode?: string
    entryPath?: string
    language?: string
  }
  if (p.files && Object.keys(p.files).length > 0) return { ...p.files }
  if (p.starterCode) {
    const path = p.entryPath || "main.js"
    return { [path]: p.starterCode }
  }
  return {}
}

export async function generateQuestionsFromJobs(
  db: Database,
  userId: string,
  trackedJobIds: string[]
): Promise<GenerateFromJobsResult> {
  if (!env.OPENROUTER_API_KEY) {
    return {
      ok: false,
      code: "not_configured",
      message: "OPENROUTER_API_KEY not configured",
    }
  }

  const ids = [...new Set(trackedJobIds)].slice(0, 5)
  if (ids.length === 0) {
    return { ok: false, code: "no_jobs", message: "No job ids provided" }
  }

  const jobs = await db
    .select()
    .from(trackedJobs)
    .where(
      and(eq(trackedJobs.userId, userId), inArray(trackedJobs.id, ids))
    )

  if (jobs.length === 0) {
    return { ok: false, code: "no_jobs", message: "No matching tracked jobs" }
  }

  const cost = env.QUESTION_GEN_CREDIT_COST
  if (cost > 0) {
    const spend = await spendCredits(db, userId, cost, "mockInterviews")
    if (!spend.ok) {
      return {
        ok: false,
        code: "insufficient_credits",
        message: `Need ${cost} credits to generate questions`,
        remaining: spend.remaining,
      }
    }
  }

  const jobBlob = jobs
    .map(
      (j) =>
        `Title: ${j.title}\nCompany: ${j.company}\nLocation: ${j.location}\nDescription: ${clampDesc(j.description ?? "")}`
    )
    .join("\n---\n")

  const routerModel = env.OPENROUTER_QUESTION_ROUTER_MODEL
  let plan: z.infer<typeof routerSchema>
  try {
    const raw = await chatJsonWithModel(
      routerModel,
      `You are a cheap planning model for an interview-prep product.
Given job description(s), choose a question mix and a generator model.
Formats: conversation (voice interview) or code_run (single-file coding IDE).
Domains: coding, systemDesign, caseStudy, product, behavioral, finance, clinical.
Prefer conversation for soft skills/product/system design talk; code_run for SWE coding.
Total count across mix ≤ ${env.QUESTION_GEN_MAX_PER_RUN}.
generatorModel must be a strong OpenRouter model id (prefer moonshotai/kimi-k3).
Reply JSON: { "generatorModel": string, "roleFamily": string, "mix": [{ "format", "domain", "difficulty", "count", "language?", "trackHint?" }], "rationale": string }`,
      jobBlob,
      0.2
    )
    plan = routerSchema.parse(raw)
  } catch (err) {
    logger.error({ err }, "question_router_failed")
    return {
      ok: false,
      code: "router_failed",
      message: "Question router model failed",
    }
  }

  // Normalize mix total
  let remaining = env.QUESTION_GEN_MAX_PER_RUN
  const mix = plan.mix
    .map((m) => {
      const count = Math.min(m.count, remaining)
      remaining -= count
      return { ...m, count }
    })
    .filter((m) => m.count > 0)

  if (mix.length === 0) {
    return {
      ok: false,
      code: "router_failed",
      message: "Router produced empty mix",
    }
  }

  const generatorModel = resolveGeneratorModel(plan.generatorModel)
  let batch: z.infer<typeof generatedBatchSchema>
  try {
    const raw = await chatJsonWithModel(
      generatorModel,
      `You write high-quality interview questions for MockMatch.
Output JSON: { "questions": [ ... ] }.
Each question:
- title, body, domain, difficulty, format (conversation|code_run)
- language (required for code_run)
- company (job company if company-specific else null)
- tags: string[]
- roleFamilies: string[]
- payload: for conversation { interviewerPrompt, followUps?, trackHint? };
  for code_run { prompt, language, starterCode?, tests?: [{name, stdin?, expectedStdout?}] }

Rules:
- Match the requested mix counts closely.
- Conversation questions fit voice AI interviewer (clear stem + follow-ups).
- trackHint for conversation MUST be one of: behavioral-core | product-sense | system-design-talk (never job titles).
- code_run = single-file problems with optional I/O tests (no multi-file workspaces).
- Do not invent whiteboard/mcq formats.
- Make questions distinct skills — not rephrasings of each other.`,
      `Role family hint: ${plan.roleFamily ?? "general"}
Mix: ${JSON.stringify(mix)}
Jobs:
${jobBlob}`,
      0.4
    )
    batch = generatedBatchSchema.parse(raw)
  } catch (err) {
    logger.error({ err }, "question_generator_failed")
    return {
      ok: false,
      code: "generator_failed",
      message: "Question generator model failed",
    }
  }

  const fingerprint = createJobFingerprint(jobs.map((j) => j.id))
  let created = 0
  let skippedExact = 0
  let skippedNear = 0
  const createdRows: Array<{ id: string; title: string; format: string }> = []

  for (const item of batch.questions.slice(0, env.QUESTION_GEN_MAX_PER_RUN)) {
    const body = item.body
    const contentHash = buildContentHash({
      title: item.title,
      body,
      format: item.format,
      language: item.language,
    })
    const searchDocument = buildSearchDocument({
      title: item.title,
      domain: item.domain,
      format: item.format,
      language: item.language,
      body,
      tags: item.tags,
    })

    const decision = await dedupeCandidate(db, {
      title: item.title,
      body,
      format: item.format,
      domain: item.domain,
      language: item.language,
      tags: item.tags,
      contentHash,
      searchDocument,
    })

    if (decision.action === "drop") {
      if (decision.reason === "exact") skippedExact += 1
      else skippedNear += 1
      logger.info(
        {
          reason: decision.reason,
          nearestId: decision.nearestId,
          score: decision.score,
          title: item.title,
        },
        "question_dedupe_skip"
      )
      continue
    }

    let payload = defaultPayload(item.format, item)
    const contentCache = contentCacheFromPayload(item.format, payload)
    try {
      const [row] = await db
        .insert(questions)
        .values({
          title: item.title,
          body,
          domain: item.domain,
          difficulty: item.difficulty,
          company: item.company ?? jobs[0]?.company ?? null,
          format: item.format,
          payload,
          language: item.language ?? null,
          roleFamilies: item.roleFamilies ?? [plan.roleFamily ?? "general"],
          tags: item.tags ?? [],
          source: "generated",
          sourceFingerprint: fingerprint,
          contentCache,
          contentVersion: "v1",
          searchDocument,
          contentHash,
          embedding: decision.embedding,
          embeddingModel: decision.embeddingModel,
          embeddingAt: decision.embedding ? new Date() : null,
          status: "published",
        })
        .returning({
          id: questions.id,
          title: questions.title,
          format: questions.format,
        })

      if (row) {
        // Bank is source of truth — files in content_cache; S3 prefix reserved
        const contentPrefix = `questions/${row.id}/v1/`
        // Ensure one-file problems always have cache entries for IDE open
        const finalCache =
          Object.keys(contentCache).length > 0
            ? contentCache
            : contentCacheFromPayload(item.format, payload)
        await db
          .update(questions)
          .set({
            payload,
            contentPrefix,
            contentCache: finalCache,
            updatedAt: new Date(),
          })
          .where(eq(questions.id, row.id))

        created += 1
        createdRows.push({
          id: row.id,
          title: row.title,
          format: row.format,
        })
      }
    } catch (err) {
      // Unique content_hash race
      skippedExact += 1
      logger.warn({ err, title: item.title }, "question_insert_conflict")
    }
  }

  // Mark jobs so we don't auto-regenerate forever
  await db
    .update(trackedJobs)
    .set({ questionsGeneratedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(trackedJobs.userId, userId), inArray(trackedJobs.id, ids))
    )

  return {
    ok: true,
    created,
    skippedExact,
    skippedNear,
    questions: createdRows,
    generatorModel,
    routerModel,
    creditsCharged: cost,
  }
}

function createJobFingerprint(ids: string[]): string {
  return ids.slice().sort().join(",")
}
