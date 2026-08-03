import { expect, it } from "vitest"
import {
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"
describeIntegration("practiceSessions (integration)", () => {
  it("list empty → startNew freeform → complete → delete", async () => {
    const caller = await signupAuthedCaller()

    const empty = await caller.practiceSessions.list({ page: 1, pageSize: 10 })
    expect(Array.isArray(empty.items)).toBe(true)
    expect(empty.total).toBe(0)

    const trackId = `freeform-${Date.now()}`
    const started = await caller.practiceSessions.startNew({
      trackId,
      abandonOpen: true,
    })
    expect(started.session.id).toBeTruthy()
    expect(started.session.trackId).toBe(trackId)
    expect(started.session.status).toBe("in_progress")
    expect(started.workspaceId).toBeTruthy()

    const open = await caller.practiceSessions.openForTrack({ trackId })
    expect(open.session?.id).toBe(started.session.id)

    const completed = await caller.practiceSessions.complete({
      sessionId: started.session.id,
      score: 80,
    })
    expect(completed.status).toBe("completed")
    expect(completed.score).toBe(80)

    const listed = await caller.practiceSessions.list({ page: 1, pageSize: 10 })
    expect(listed.items.some((s) => s.id === started.session.id)).toBe(true)

    const del = await caller.practiceSessions.delete({
      sessionId: started.session.id,
    })
    expect(del.ok).toBe(true)
  })

  it("abandon ends in_progress session", async () => {
    const caller = await signupAuthedCaller()
    const trackId = `abandon-${Date.now()}`
    const started = await caller.practiceSessions.startNew({ trackId })

    const abandoned = await caller.practiceSessions.abandon({
      sessionId: started.session.id,
    })
    expect(abandoned.status).toBe("abandoned")

    await caller.practiceSessions.delete({ sessionId: started.session.id })
  })
})
