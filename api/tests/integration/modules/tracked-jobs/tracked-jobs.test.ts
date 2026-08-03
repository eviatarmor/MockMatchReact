import { expect, it } from "vitest"
import {
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

describeIntegration("trackedJobs (integration)", () => {
  it("list → upsert → updateStatus → remove", async () => {
    const caller = await signupAuthedCaller()

    const empty = await caller.trackedJobs.list()
    expect(Array.isArray(empty)).toBe(true)

    const sourceKey = `manual:test-${Date.now()}`
    const { job, questionGen } = await caller.trackedJobs.upsert({
      sourceKey,
      provider: "manual",
      title: "Backend Engineer",
      company: "MockMatch",
      location: "Remote",
      status: "saved",
      generateQuestions: false,
    })
    expect(job.id).toBeTruthy()
    expect(job.title).toBe("Backend Engineer")
    expect(job.company).toBe("MockMatch")
    expect(job.status).toBe("saved")
    expect(job.sourceKey).toBe(sourceKey)
    expect(questionGen).toBe("skipped_no_flag")

    const listed = await caller.trackedJobs.list()
    expect(listed.some((j) => j.id === job.id)).toBe(true)

    const updated = await caller.trackedJobs.updateStatus({
      id: job.id,
      status: "applied",
    })
    expect(updated.status).toBe("applied")

    const byStatus = await caller.trackedJobs.list({ status: "applied" })
    expect(byStatus.some((j) => j.id === job.id)).toBe(true)

    await caller.trackedJobs.remove({ id: job.id })
    const after = await caller.trackedJobs.list()
    expect(after.some((j) => j.id === job.id)).toBe(false)
  })

  it("removeBySourceKey works", async () => {
    const caller = await signupAuthedCaller()
    const sourceKey = `manual:rm-key-${Date.now()}`
    await caller.trackedJobs.upsert({
      sourceKey,
      title: "Temp Role",
      company: "Temp Co",
      generateQuestions: false,
    })
    const out = await caller.trackedJobs.removeBySourceKey({ sourceKey })
    expect(out.ok).toBe(true)
    const listed = await caller.trackedJobs.list()
    expect(listed.some((j) => j.sourceKey === sourceKey)).toBe(false)
  })
})
