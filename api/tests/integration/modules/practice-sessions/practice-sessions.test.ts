import { expect, it } from "vitest"
import {
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

describeIntegration("practiceSessions (integration)", () => {
  it("list empty → startNew freeform → complete → delete", async () => {
    const caller = await signupAuthedCaller()

    const empty = await caller.practiceSessions.list({ page: 1, pageSize: 10 })
    expect(Array.isArray(empty.items)).toBe(true)
    expect(empty.total).toBe(0)

    const trackId = `freeform-${Date.now()}`
    const started = await caller.practiceSessions.startNew({
      trackId,
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

  it("startNew reuses same session + workspace (no retakes)", async () => {
    const caller = await signupAuthedCaller()
    const trackId = `reuse-${Date.now()}`

    const first = await caller.practiceSessions.startNew({ trackId })
    const second = await caller.practiceSessions.startNew({ trackId })

    expect(second.session.id).toBe(first.session.id)
    expect(second.workspaceId).toBe(first.workspaceId)

    const listed = await caller.practiceSessions.list({ page: 1, pageSize: 50 })
    const rows = listed.items.filter((s) => s.trackId === trackId)
    expect(rows).toHaveLength(1)

    await caller.practiceSessions.delete({ sessionId: first.session.id })
  })

  it("abandon ends in_progress session", async () => {
    const caller = await signupAuthedCaller()
    const trackId = `abandon-${Date.now()}`
    const started = await caller.practiceSessions.startNew({ trackId })

    const abandoned = await caller.practiceSessions.abandon({
      sessionId: started.session.id,
    })
    expect(abandoned.status).toBe("abandoned")

    // Reopen still reuses the same history row + workspace.
    const again = await caller.practiceSessions.startNew({ trackId })
    expect(again.session.id).toBe(started.session.id)
    expect(again.workspaceId).toBe(started.workspaceId)
    expect(again.session.status).toBe("in_progress")

    await caller.practiceSessions.delete({ sessionId: started.session.id })
  })

  it("startWhiteboard links owned board; rejects foreign board", async () => {
    const { db } = await import("../../../../src/db/client.js")
    const { questions } = await import(
      "../../../../src/db/schema/questions.js"
    )
    const { eq } = await import("drizzle-orm")

    const owner = await signupAuthedCaller("wb-owner")
    const other = await signupAuthedCaller("wb-other")

    const stamp = Date.now()
    const [q] = await db
      .insert(questions)
      .values({
        title: `WB test ${stamp}`,
        domain: "coding",
        difficulty: "easy",
        format: "whiteboard",
        source: "manual",
        status: "published",
        payload: { prompt: "Draw a system" },
        contentHash: `wb-test-${stamp}-${Math.random().toString(36).slice(2)}`,
      })
      .returning({ id: questions.id })
    if (!q) throw new Error("failed to insert question")

    const board = await owner.whiteboard.create({
      title: "Practice board",
      questionId: q.id,
    })

    const session = await owner.practiceSessions.startWhiteboard({
      questionId: q.id,
      boardId: board.id,
      title: "WB practice",
    })
    expect(session.boardId).toBe(board.id)
    expect(session.questionId).toBe(q.id)
    expect(session.status).toBe("in_progress")

    // Idempotent re-link
    const again = await owner.practiceSessions.startWhiteboard({
      questionId: q.id,
      boardId: board.id,
    })
    expect(again.id).toBe(session.id)

    await expect(
      other.practiceSessions.startWhiteboard({
        questionId: q.id,
        boardId: board.id,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" })

    await expect(
      owner.practiceSessions.startWhiteboard({
        questionId: q.id,
        boardId: "22222222-2222-4222-8222-222222222222",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" })

    await owner.practiceSessions.delete({ sessionId: session.id })
    await owner.whiteboard.delete({ id: board.id })
    await db.delete(questions).where(eq(questions.id, q.id))
  })
})
