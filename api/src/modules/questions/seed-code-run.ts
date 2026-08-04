/**
 * Upsert seed bank questions for code_run practice (dev/test).
 * Opens at `/simulations/:questionId` — no format slug.
 */

import { eq } from "drizzle-orm"
import type { Database } from "../../db/client.js"
import { questions } from "../../db/schema/questions.js"
import { buildContentHash, buildSearchDocument } from "./dedupe.js"
import { CODE_RUN_SEED_QUESTIONS } from "./seed-code-run-data.js"

export type SeedCodeRunResult = {
  inserted: number
  skipped: number
  rows: Array<{ id: string; title: string; format: string }>
}

export async function seedCodeRunQuestions(
  db: Database
): Promise<SeedCodeRunResult> {
  let inserted = 0
  let skipped = 0
  const rows: Array<{ id: string; title: string; format: string }> = []

  for (const item of CODE_RUN_SEED_QUESTIONS) {
    const body = item.body
    const contentHash = buildContentHash({
      title: item.title,
      body,
      format: item.format,
      language: item.language,
    })

    const existing = await db.query.questions.findFirst({
      where: eq(questions.contentHash, contentHash),
      columns: { id: true, title: true, format: true },
    })

    if (existing) {
      skipped += 1
      rows.push({
        id: existing.id,
        title: existing.title,
        format: existing.format,
      })
      continue
    }

    const searchDocument = buildSearchDocument({
      title: item.title,
      domain: item.domain,
      format: item.format,
      language: item.language,
      body,
      tags: item.tags,
    })

    const [row] = await db
      .insert(questions)
      .values({
        title: item.title,
        body,
        domain: item.domain,
        difficulty: item.difficulty,
        company: item.company ?? null,
        format: item.format,
        payload: item.payload,
        language: item.language,
        roleFamilies: item.roleFamilies,
        tags: item.tags,
        source: "seed",
        contentCache: item.contentCache,
        contentVersion: "v1",
        searchDocument,
        contentHash,
        status: "published",
      })
      .returning({
        id: questions.id,
        title: questions.title,
        format: questions.format,
      })

    if (row) {
      const contentPrefix = `questions/${row.id}/v1/`
      await db
        .update(questions)
        .set({ contentPrefix, updatedAt: new Date() })
        .where(eq(questions.id, row.id))

      inserted += 1
      rows.push(row)
    }
  }

  return { inserted, skipped, rows }
}
