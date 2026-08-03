/**
 * Seed spreadsheet + page bank questions for local practice testing.
 *
 *   cd api && npx tsx scripts/seed-spreadsheet-page-questions.ts
 */
import { config as loadDotenv } from "dotenv"
loadDotenv()

import { db, closeDb } from "../src/db/client.js"
import { seedSpreadsheetPageQuestions } from "../src/modules/questions/seed-spreadsheet-page.js"

async function main() {
  const result = await seedSpreadsheetPageQuestions(db)
  console.log(
    `Spreadsheet/page seed: inserted=${result.inserted} skipped=${result.skipped}`
  )
  for (const row of result.rows) {
    const path =
      row.format === "spreadsheet"
        ? `/simulations/spreadsheet?questionId=${row.id}`
        : `/simulations/page?questionId=${row.id}`
    console.log(`  [${row.format}] ${row.title}`)
    console.log(`    id=${row.id}`)
    console.log(`    ${path}`)
  }
  await closeDb()
}

main().catch(async (err) => {
  console.error(err)
  await closeDb().catch(() => {})
  process.exit(1)
})
