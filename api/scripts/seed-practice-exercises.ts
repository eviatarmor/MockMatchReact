/**
 * Seed practice exercise catalog (+ upload to S3 when AWS_S3_BUCKET is set).
 *
 *   cd api && npx tsx scripts/seed-practice-exercises.ts
 */
import { config as loadDotenv } from "dotenv"
loadDotenv()

import { db, closeDb } from "../src/db/client.js"
import { seedPracticeExercises } from "../src/modules/practice-exercises/service.js"

async function main() {
  const result = await seedPracticeExercises(db, { uploadS3: true })
  console.log(
    `Seeded ${result.upserted} exercises; uploaded ${result.s3Uploaded} S3 objects`
  )
  await closeDb()
}

main().catch(async (err) => {
  console.error(err)
  await closeDb().catch(() => {})
  process.exit(1)
})
