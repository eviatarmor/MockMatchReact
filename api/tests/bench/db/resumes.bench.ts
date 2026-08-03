import { bench, describe } from "vitest"
import { env } from "@/config/env.js"
import {
  createCaller,
  describeBenchIntegration,
  integrationAvailable,
} from "../../helpers/integration.js"

type Caller = ReturnType<typeof createCaller>

/**
 * Resume list/get against real Postgres (Docker / Testcontainers).
 * Seed once before benches (not in beforeAll — Vitest bench + async beforeAll
 * was yielding NaN samples on some runs).
 */
describeBenchIntegration("db resumes (Postgres)", () => {
  let caller: Caller
  let firstId = ""
  let seeded = false

  async function ensureSeed() {
    if (seeded || !integrationAvailable()) return
    const email = `bench-resumes+${Date.now()}@example.com`
    const pub = createCaller(null)
    await pub.auth.requestOtp({
      purpose: "signup",
      email,
      fullName: "Bench User",
      agreeToTerms: true,
    })
    const { user } = await pub.auth.verifyOtp({
      email,
      code: env.OTP_STUB_CODE || "000000",
      purpose: "signup",
    })
    caller = createCaller({ id: user.id, email: user.email })
    const SEED = 20
    for (let i = 0; i < SEED; i++) {
      const row = await caller.resumes.create({
        title: `Bench Resume ${String(i).padStart(3, "0")}`,
        targetRole: i % 2 === 0 ? "Engineer" : "Designer",
      })
      if (i === 0) firstId = row.id
    }
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

