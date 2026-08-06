import { describe, expect, it } from "vitest"
import { TRPCError } from "@trpc/server"
import { assertQuestionReadable } from "@/modules/questions/custom.js"

describe("assertQuestionReadable", () => {
  const owner = "11111111-1111-1111-1111-111111111111"
  const other = "22222222-2222-2222-2222-222222222222"

  it("allows global published for any user", () => {
    expect(() =>
      assertQuestionReadable(
        { status: "published", visibility: "global", ownerUserId: null },
        other
      )
    ).not.toThrow()
  })

  it("allows self published only for owner", () => {
    expect(() =>
      assertQuestionReadable(
        { status: "published", visibility: "self", ownerUserId: owner },
        owner
      )
    ).not.toThrow()
    expect(() =>
      assertQuestionReadable(
        { status: "published", visibility: "self", ownerUserId: owner },
        other
      )
    ).toThrow(TRPCError)
  })

  it("blocks self draft on practice path unless allowDraftForOwner", () => {
    expect(() =>
      assertQuestionReadable(
        { status: "draft", visibility: "self", ownerUserId: owner },
        owner
      )
    ).toThrow(/Deploy/)
    expect(() =>
      assertQuestionReadable(
        { status: "draft", visibility: "self", ownerUserId: owner },
        owner,
        { allowDraftForOwner: true }
      )
    ).not.toThrow()
  })

  it("hides archived", () => {
    expect(() =>
      assertQuestionReadable(
        { status: "archived", visibility: "global", ownerUserId: null },
        owner
      )
    ).toThrow(TRPCError)
  })
})
