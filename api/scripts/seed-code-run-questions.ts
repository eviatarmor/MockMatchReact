/**
 * Seed code_run bank questions for local practice testing.
 * Practice URL: /simulations/:questionId (no format slug).
 *
 *   cd api && npx tsx scripts/seed-code-run-questions.ts
 *   # or: npm run db:seed:code-run
 */
import { config as loadDotenv } from "dotenv"
loadDotenv()

import { db, closeDb } from "../src/db/client.js"
import { seedCodeRunQuestions } from "../src/modules/questions/seed-code-run.js"

async function main() {
  const result = await seedCodeRunQuestions(db)
  console.log(
    `Code-run seed: inserted=${result.inserted} skipped=${result.skipped}`
  )
  for (const row of result.rows) {
    console.log(`  [${row.format}] ${row.title}`)
    console.log(`    id=${row.id}`)
    console.log(`    /simulations/${row.id}`)
  }
  await closeDb()
}

main().catch(async (err) => {
  console.error(err)
  await closeDb().catch(() => {})
  process.exit(1)
})
