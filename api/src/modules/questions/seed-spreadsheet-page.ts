/**
 * Upsert seed bank questions for spreadsheet + page practice (dev/test).
 */

import { eq } from "drizzle-orm"
import type { Database } from "../../db/client.js"
import { questions } from "../../db/schema/questions.js"
import { buildContentHash, buildSearchDocument } from "./dedupe.js"
import { SPREADSHEET_PAGE_SEED_QUESTIONS } from "./seed-spreadsheet-page-data.js"

export type SeedSpreadsheetPageResult = {
  inserted: number
  skipped: number
  rows: Array<{ id: string; title: string; format: string }>
}

export async function seedSpreadsheetPageQuestions(
  db: Database
): Promise<SeedSpreadsheetPageResult> {
  let inserted = 0
  let skipped = 0
  const rows: Array<{ id: string; title: string; format: string }> = []

  for (const item of SPREADSHEET_PAGE_SEED_QUESTIONS) {
    const body = item.body
    const contentHash = buildContentHash({
      title: item.title,
      body,
      format: item.format,
      language: null,
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
        language: null,
        roleFamilies: item.roleFamilies,
        tags: item.tags,
        source: "seed",
        contentCache: {},
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
      inserted += 1
      rows.push(row)
    }
  }

  return { inserted, skipped, rows }
}
