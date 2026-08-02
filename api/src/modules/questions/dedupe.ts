import { createHash } from "node:crypto"
import { sql } from "drizzle-orm"
import type { Database } from "../../db/client.js"
import { questions } from "../../db/schema/questions.js"
import { cosineSimilarity, embedText } from "../../lib/embeddings.js"
import { chatJsonWithModel } from "./openrouter-json.js"
import { env } from "../../config/env.js"
import { logger } from "../../lib/logger.js"

/** Cosine ≥ this → near-duplicate drop without LLM. */
export const DEDUPE_HIGH = 0.9
/** Cosine in [LOW, HIGH) → cheap LLM same-skill judge. */
export const DEDUPE_LOW = 0.82
const NEIGHBOR_K = 8

export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function buildContentHash(input: {
  title: string
  body: string
  format: string
  language?: string | null
}): string {
  const raw = [
    normalizeQuestionText(input.title),
    normalizeQuestionText(input.body),
    input.format,
    (input.language ?? "").toLowerCase().trim(),
  ].join("|")
  return createHash("sha256").update(raw).digest("hex")
}

export function buildSearchDocument(input: {
  title: string
  domain: string
  format: string
  language?: string | null
  body?: string | null
  tags?: string[]
}): string {
  return [
    input.title,
    input.domain,
    input.format,
    input.language ?? "",
    input.body ?? "",
    (input.tags ?? []).join(" "),
  ]
    .filter(Boolean)
    .join("\n")
}

export type DedupeDecision =
  | { action: "keep"; embedding: number[] | null; embeddingModel: string | null }
  | {
      action: "drop"
      reason: "exact" | "near" | "band"
      nearestId?: string
      score?: number
    }

export async function dedupeCandidate(
  db: Database,
  candidate: {
    title: string
    body: string
    format: string
    domain: string
    language?: string | null
    tags?: string[]
    contentHash: string
    searchDocument: string
  }
): Promise<DedupeDecision> {
  const exact = await db
    .select({ id: questions.id })
    .from(questions)
    .where(sql`${questions.contentHash} = ${candidate.contentHash}`)
    .limit(1)

  if (exact[0]) {
    return { action: "drop", reason: "exact", nearestId: exact[0].id }
  }

  const embedded = await embedText(candidate.searchDocument)
  if (!embedded) {
    // No embeddings → keep (exact hash already checked)
    return { action: "keep", embedding: null, embeddingModel: null }
  }

  // pgvector cosine distance: 1 - cosine similarity via <=> operator
  const neighbors = await db.execute<{
    id: string
    title: string
    body: string | null
    distance: number
  }>(sql`
    SELECT id, title, body,
      (embedding <=> ${sql.raw(`'[${embedded.vector.join(",")}]'::vector`)}) AS distance
    FROM questions
    WHERE embedding IS NOT NULL
      AND status = 'published'
    ORDER BY embedding <=> ${sql.raw(`'[${embedded.vector.join(",")}]'::vector`)}
    LIMIT ${NEIGHBOR_K}
  `)

  const rows = (neighbors as unknown as { rows?: typeof neighbors }).rows
    ?? (Array.isArray(neighbors) ? neighbors : [])

  let best: { id: string; title: string; body: string | null; sim: number } | null =
    null

  for (const row of rows as Array<{
    id: string
    title: string
    body: string | null
    distance: number
  }>) {
    const sim = 1 - Number(row.distance)
    if (!best || sim > best.sim) {
      best = { id: row.id, title: row.title, body: row.body, sim }
    }
  }

  if (!best) {
    return {
      action: "keep",
      embedding: embedded.vector,
      embeddingModel: embedded.model,
    }
  }

  if (best.sim >= DEDUPE_HIGH) {
    return {
      action: "drop",
      reason: "near",
      nearestId: best.id,
      score: best.sim,
    }
  }

  if (best.sim >= DEDUPE_LOW) {
    const same = await judgeSameSkill(
      { title: candidate.title, body: candidate.body },
      { title: best.title, body: best.body ?? "" }
    )
    if (same) {
      return {
        action: "drop",
        reason: "band",
        nearestId: best.id,
        score: best.sim,
      }
    }
  }

  return {
    action: "keep",
    embedding: embedded.vector,
    embeddingModel: embedded.model,
  }
}

async function judgeSameSkill(
  a: { title: string; body: string },
  b: { title: string; body: string }
): Promise<boolean> {
  try {
    const result = await chatJsonWithModel(
      env.OPENROUTER_QUESTION_ROUTER_MODEL,
      `You judge whether two interview questions test the SAME skill/assessment.
Reply JSON only: { "same": boolean, "reason": string }.
same=true if a candidate practicing one has already covered the other.`,
      `A: ${a.title}\n${a.body.slice(0, 600)}\n\nB: ${b.title}\n${b.body.slice(0, 600)}`
    )
    const obj = result as { same?: boolean }
    return obj.same === true
  } catch (err) {
    logger.warn({ err }, "dedupe_band_judge_failed")
    // Fail open (keep) on judge errors
    return false
  }
}

/** Optional local cosine check when raw SQL shape differs — unit-friendly. */
export function localMaxCosine(
  candidate: number[],
  corpus: number[][]
): number {
  let max = 0
  for (const v of corpus) {
    max = Math.max(max, cosineSimilarity(candidate, v))
  }
  return max
}
