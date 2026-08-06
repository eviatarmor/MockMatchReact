import { expect, it } from "vitest"
import { db } from "@/db/client.js"
import { questions } from "@/db/schema/questions.js"
import {
  createCaller,
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"

/** Insert a residual self-scoped row (authoring APIs removed). */
async function insertSelfQuestion(opts: {
  ownerUserId: string
  title: string
  domain: "coding" | "behavioral"
  format: "mcq" | "conversation"
  status: "draft" | "published"
  body: string
  payload: Record<string, unknown>
  contentHash: string
}) {
  const [row] = await db
    .insert(questions)
    .values({
      title: opts.title,
      body: opts.body,
      domain: opts.domain,
      difficulty: "easy",
      format: opts.format,
      payload: opts.payload,
      source: "manual",
      ownerUserId: opts.ownerUserId,
      visibility: "self",
      contentHash: opts.contentHash,
      searchDocument: opts.title,
      status: opts.status,
    })
    .returning()
  if (!row) throw new Error("insertSelfQuestion failed")
  return row
}

describeIntegration("questions (integration)", () => {
  it("list returns paginated shape (may be empty)", async () => {
    const caller = await signupAuthedCaller()
    const result = await caller.questions.list({
      page: 1,
      pageSize: 20,
    })
    expect(Array.isArray(result.items)).toBe(true)
    expect(typeof result.total).toBe("number")
  })

  it("list accepts empty input defaults", async () => {
    const caller = await signupAuthedCaller()
    const result = await caller.questions.list()
    expect(Array.isArray(result.items)).toBe(true)
    expect(typeof result.total).toBe("number")
  })

  it("list requires auth", async () => {
    const publicCaller = createCaller(null)
    await expect(publicCaller.questions.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    })
  })

  it("residual self published rows appear for owner only (customOnly)", async () => {
    const owner = await signupAuthedCaller("self-owner")
    const other = await signupAuthedCaller("self-other")
    const ownerUser = await owner.auth.me()
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const row = await insertSelfQuestion({
      ownerUserId: ownerUser.id,
      title: `Residual self MCQ ${stamp}`,
      domain: "coding",
      format: "mcq",
      status: "published",
      body: "Pick the even number.",
      payload: {
        stem: "Pick the even number.",
        options: ["1", "2", "3"],
        correctIndex: 1,
        variant: "single",
      },
      contentHash: `self-mcq-${stamp}`,
    })

    const bank = await owner.questions.list({
      customOnly: true,
      page: 1,
      pageSize: 50,
    })
    expect(bank.items.some((i) => i.id === row.id && i.isCustom)).toBe(true)

    const otherBank = await other.questions.list({
      customOnly: true,
      page: 1,
      pageSize: 50,
    })
    expect(otherBank.items.some((i) => i.id === row.id)).toBe(false)
    await expect(other.questions.forMcq({ id: row.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    })

    const mcq = await owner.questions.forMcq({ id: row.id })
    expect(mcq.options).toEqual(["1", "2", "3"])
  })

  /**
   * SEC-001: voice.createSession must ACL conversation self-rows via assertQuestionReadable.
   * Isolation runs before worker config so tests need no voice worker.
   */
  it("voice createSession: owner OK path / other denied / draft blocked (SEC-001)", async () => {
    const owner = await signupAuthedCaller("voice-owner")
    const other = await signupAuthedCaller("voice-other")
    const ownerUser = await owner.auth.me()
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const draft = await insertSelfQuestion({
      ownerUserId: ownerUser.id,
      title: `Voice custom draft ${stamp}`,
      domain: "behavioral",
      format: "conversation",
      status: "draft",
      body: "SECRET_DRAFT_PROMPT_do_not_leak",
      payload: {
        interviewerPrompt: "SECRET_DRAFT_PROMPT_do_not_leak",
        trackHint: "behavioral-core",
      },
      contentHash: `voice-draft-${stamp}`,
    })

    // Draft blocked for owner (must be published)
    await expect(
      owner.voice.createSession({
        trackId: "behavioral-core",
        questionId: draft.id,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" })

    // Other user cannot probe draft existence via voice
    await expect(
      other.voice.createSession({
        trackId: "behavioral-core",
        questionId: draft.id,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" })

    const published = await insertSelfQuestion({
      ownerUserId: ownerUser.id,
      title: `Voice custom published ${stamp}`,
      domain: "behavioral",
      format: "conversation",
      status: "published",
      body: "Tell me about a conflict.",
      payload: {
        interviewerPrompt: "Tell me about a conflict.",
        trackHint: "behavioral-core",
      },
      contentHash: `voice-pub-${stamp}`,
    })

    // Other user still denied after self-published
    await expect(
      other.voice.createSession({
        trackId: "behavioral-core",
        questionId: published.id,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" })

    // Owner reaches ACL OK — may still get not_configured without a worker
    const ownerResult = await owner.voice.createSession({
      trackId: "behavioral-core",
      questionId: published.id,
    })
    if (ownerResult.ok === false) {
      expect(ownerResult.code).toBe("not_configured")
    } else {
      expect(ownerResult.ok).toBe(true)
      expect(ownerResult.session.id).toBeTruthy()
    }
  })
})
