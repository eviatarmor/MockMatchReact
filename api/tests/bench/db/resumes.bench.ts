import { bench } from "vitest"
import {
  describeIntegration,
  integrationAvailable,
  signupAuthedCaller,
  type AuthedCaller,
} from "../../helpers/integration.js"

async function seedResumes(): Promise<{
  caller: AuthedCaller
  firstId: string
}> {
  const caller = await signupAuthedCaller("bench-resumes")
  const titles = Array.from(
    { length: 20 },
    (_, i) => `Bench Resume ${String(i).padStart(3, "0")}`
  )
  const rows = await Promise.all(
    titles.map((title, i) =>
      caller.resumes.create({
        title,
        targetRole: i % 2 === 0 ? "Engineer" : "Designer",
      })
    )
  )
  return { caller, firstId: rows[0]!.id }
}

/**
 * Resume list/get against real Postgres (Docker / Testcontainers).
 */
describeIntegration("db resumes (Postgres)", () => {
  let caller: AuthedCaller
  let firstId = ""
  let seeded = false

  async function ensureSeed(): Promise<void> {
    if (seeded || !integrationAvailable()) return
    ;({ caller, firstId } = await seedResumes())
    seeded = true
  }

  bench(
    "resumes.list page 1 (pageSize 10)",
    async () => {
      await ensureSeed()
      await caller.resumes.list({ page: 1, pageSize: 10 })
    },
    { time: 500 }
  )

  bench(
    "resumes.list page 1 (pageSize 20) + search",
    async () => {
      await ensureSeed()
      await caller.resumes.list({
        page: 1,
        pageSize: 20,
        search: "Engineer",
      })
    },
    { time: 500 }
  )

  bench(
    "resumes.get by id",
    async () => {
      await ensureSeed()
      await caller.resumes.get({ id: firstId })
    },
    { time: 500 }
  )

  bench(
    "resumes.create + delete cycle",
    async () => {
      await ensureSeed()
      const row = await caller.resumes.create({ title: "tmp-bench" })
      await caller.resumes.delete({ id: row.id })
    },
    { time: 500 }
  )
})
