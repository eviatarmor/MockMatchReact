import { z } from "zod"
import { env } from "../../config/env.js"
import type { Database } from "../../db/client.js"
import {
  questions,
  type McqQuestionPayload,
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
import {
  normalizePagePayload,
  normalizeSpreadsheetPayload,
} from "./payloads.js"

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

const QUESTION_DOMAINS = [
  "coding",
  "systemDesign",
  "caseStudy",
  "product",
  "behavioral",
  "finance",
  "clinical",
  "dataScience",
  "ml",
  "security",
  "devops",
  "design",
  "consulting",
  "marketing",
  "sales",
] as const

const GENERATABLE_FORMATS = [
  "conversation",
  "code_run",
  "mcq",
  "spreadsheet",
  "page",
] as const

const routerSchema = z.object({
  generatorModel: z.string().optional(),
  roleFamily: z.string().optional(),
  mix: z
    .array(
      z.object({
        format: z.enum(GENERATABLE_FORMATS),
        domain: z.enum(QUESTION_DOMAINS),
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
  domain: z.enum(QUESTION_DOMAINS),
  difficulty: z.enum(["easy", "medium", "hard"]),
  format: z.enum(GENERATABLE_FORMATS),
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

function normalizeMcqPayload(
  item: z.infer<typeof generatedItemSchema>
): McqQuestionPayload | null {
  const fromPayload = (item.payload ?? {}) as Record<string, unknown>
  const rawOptions = fromPayload.options
  const options = Array.isArray(rawOptions)
    ? rawOptions
        .map((o) => (typeof o === "string" ? o.trim() : String(o ?? "").trim()))
        .filter((o) => o.length > 0)
        .slice(0, 6)
    : []
  if (options.length < 2) return null

  const stem =
    typeof fromPayload.stem === "string" && fromPayload.stem.trim()
      ? fromPayload.stem.trim()
      : item.body
  const explanation =
    typeof fromPayload.explanation === "string" && fromPayload.explanation.trim()
      ? fromPayload.explanation.trim()
      : undefined

  let variant: McqQuestionPayload["variant"] =
    fromPayload.variant === "multi" ||
    fromPayload.variant === "order" ||
    fromPayload.variant === "single"
      ? fromPayload.variant
      : undefined
  if (!variant) {
    if (Array.isArray(fromPayload.correctOrder)) variant = "order"
    else if (Array.isArray(fromPayload.correctIndices)) variant = "multi"
    else variant = "single"
  }

  if (variant === "multi") {
    let correctIndices = Array.isArray(fromPayload.correctIndices)
      ? fromPayload.correctIndices
          .filter((n): n is number => typeof n === "number" && Number.isInteger(n))
          .filter((n) => n >= 0 && n < options.length)
      : []
    if (correctIndices.length === 0) {
      if (
        typeof fromPayload.correctIndex === "number" &&
        fromPayload.correctIndex >= 0 &&
        fromPayload.correctIndex < options.length
      ) {
        correctIndices = [fromPayload.correctIndex]
      } else return null
    }
    correctIndices = [...new Set(correctIndices)].sort((a, b) => a - b)
    return {
      stem,
      options,
      variant: "multi",
      correctIndices,
      ...(explanation ? { explanation } : {}),
    }
  }

  if (variant === "order") {
    let correctOrder = Array.isArray(fromPayload.correctOrder)
      ? fromPayload.correctOrder
          .filter((n): n is number => typeof n === "number" && Number.isInteger(n))
          .filter((n) => n >= 0 && n < options.length)
      : []
    if (correctOrder.length !== options.length) {
      // Identity order when model listed steps already sorted
      correctOrder = options.map((_, i) => i)
    }
    const sorted = [...correctOrder].sort((a, b) => a - b)
    if (!sorted.every((v, i) => v === i)) return null
    return {
      stem,
      options,
      variant: "order",
      correctOrder,
      ...(explanation ? { explanation } : {}),
    }
  }

  let correctIndex =
    typeof fromPayload.correctIndex === "number" &&
    Number.isInteger(fromPayload.correctIndex)
      ? fromPayload.correctIndex
      : -1
  if (correctIndex < 0 || correctIndex >= options.length) {
    const letter = fromPayload.correctOption ?? fromPayload.correct
    if (typeof letter === "string" && /^[A-Fa-f]$/.test(letter.trim())) {
      correctIndex = letter.trim().toUpperCase().charCodeAt(0) - 65
    }
  }
  if (correctIndex < 0 || correctIndex >= options.length) return null

  return {
    stem,
    options,
    variant: "single",
    correctIndex,
    ...(explanation ? { explanation } : {}),
  }
}

function defaultPayload(
  format: (typeof GENERATABLE_FORMATS)[number],
  item: z.infer<typeof generatedItemSchema>
): QuestionPayload | null {
  if (format === "conversation") {
    const fromPayload = (item.payload ?? {}) as { trackHint?: string }
    return {
      interviewerPrompt: item.body,
      followUps: [],
      ...(item.payload ?? {}),
      trackHint: safeTrackHint(
        item.domain,
        fromPayload.trackHint ?? (item.payload?.trackHint as string | undefined)
      ),
    }
  }
  if (format === "mcq") {
    return normalizeMcqPayload(item)
  }
  if (format === "spreadsheet") {
    return normalizeSpreadsheetPayload({
      title: item.title,
      body: item.body,
      domain: item.domain,
      difficulty: item.difficulty,
      format: item.format,
      language: item.language,
      payload: item.payload as Record<string, unknown> | undefined,
    })
  }
  if (format === "page") {
    return normalizePagePayload({
      title: item.title,
      body: item.body,
      domain: item.domain,
      difficulty: item.difficulty,
      format: item.format,
      language: item.language,
      payload: item.payload as Record<string, unknown> | undefined,
    })
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
Formats: conversation (voice interview), code_run (single-file coding IDE), mcq (pick the right answer / knowledge check), spreadsheet (Excel-like case / finance tables with formulas), page (freeform Notion-like document analysis / written case).
Domains: coding, systemDesign, caseStudy, product, behavioral, finance, clinical, dataScience, ml, security, devops, design, consulting, marketing, sales.
Prefer conversation for soft skills/product/system design talk; code_run for SWE coding; mcq for factual/screening knowledge; spreadsheet for finance/consulting/ops quantitative cases; page for long-form case writeups, product memos, or document analysis.
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
- title, body, domain, difficulty, format (conversation|code_run|mcq|spreadsheet|page)
- language (required for code_run)
- company (job company if company-specific else null)
- tags: string[]
- roleFamilies: string[]
- payload:
  - conversation: { interviewerPrompt, followUps?, trackHint? }
  - code_run: { prompt, language, starterCode?, tests?: [{name, stdin?, expectedStdout?}] }
  - mcq: { stem, options: string[3-5], variant?: "single"|"multi"|"order",
    correctIndex? (single), correctIndices? (multi), correctOrder? (order = permutation of indices),
    explanation? }
  - spreadsheet: { prompt, durationMin?, rubric?,
    starterWorkbook?: { version: 1, activeSheetId, sheets: [{ id, name, rowCount, colCount,
      cells: { "row:col": { raw: string } } }] } }
    Use sparse cells only. Put headers, given inputs, and 1–3 formulas the candidate should extend or fix.
    Cell keys are 0-based "row:col" (A1 → "0:0"). Prefer finance/consulting/ops table cases.
  - page: { prompt, durationMin?, rubric?, starterHtml? }
    starterHtml is a short outline (h1/h2/p/ul only) the candidate expands — not the full answer.

Rules:
- Match the requested mix counts closely.
- Conversation questions fit voice AI interviewer (clear stem + follow-ups).
- trackHint for conversation MUST be one of: behavioral-core | product-sense | system-design-talk (never job titles).
- code_run = single-file problems with optional I/O tests (no multi-file workspaces).
- mcq variants: single (one correct), multi (select all that apply), order (arrange steps). Use multi/order when the skill fits; otherwise single. 3–5 options; no "all of the above" spam; body matches stem.
- spreadsheet: realistic quantitative case the candidate solves in a grid (not pure narrative). Include starterWorkbook when it helps.
- page: written analysis / memo / case writeup; starterHtml optional outline only.
- Do not invent whiteboard formats.
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

    const payload = defaultPayload(item.format, item)
    if (!payload) {
      skippedNear += 1
      logger.warn(
        { title: item.title, format: item.format },
        "question_invalid_payload_skip"
      )
      continue
    }
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
