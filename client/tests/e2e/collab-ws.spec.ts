import { test, expect } from "@playwright/test"
import {
  E2E_SKIP,
  E2E_WS_URL,
  apiReachable,
  connectCollabWs,
  holdCollabWs,
  signupViaApi,
  trpcMutationData,
  uniqueEmail,
} from "./helpers"

type WsTicketResult = {
  ticket: string
  wsUrl: string
  role: string
}

test.describe("collab websocket", () => {
  test.skip(E2E_SKIP, "E2E_SKIP=1")

  test.beforeEach(async ({ request }) => {
    test.skip(!(await apiReachable(request)), "API not reachable")
  })

  test("owner gets snapshot over WS after resume create", async ({
    request,
  }) => {
    await signupViaApi(request)

    const resume = await trpcMutationData<
      { title: string },
      { id: string; title: string }
    >(request, "resumes.create", { title: "Collab WS Resume" })

    const ticketRes = await trpcMutationData<
      { kind: string; id: string },
      WsTicketResult
    >(request, "collab.wsTicket", {
      kind: "resume",
      id: resume.id,
    })

    expect(ticketRes.ticket).toBeTruthy()
    expect(ticketRes.role).toBe("owner")
    const wsUrl = ticketRes.wsUrl || `${E2E_WS_URL}/collab`

    let msg: Record<string, unknown>
    try {
      msg = await connectCollabWs(wsUrl, ticketRes.ticket)
    } catch (err) {
      test.skip(
        true,
        `WS server not reachable (${String(err)}). Start npm run dev:ws`
      )
      return
    }

    if (msg.type === "error") {
      throw new Error(`collab error: ${JSON.stringify(msg)}`)
    }

    expect(msg.type).toBe("snapshot")
    expect(msg.role).toBe("owner")
    expect(msg.document).toBeTruthy()
    expect(msg.self).toBeTruthy()
  })
})

test.describe("collab multiplayer share", () => {
  test.skip(E2E_SKIP, "E2E_SKIP=1")

  test("guest joins shared resume while owner WS is live", async ({
    browser,
    request,
  }) => {
    test.skip(!(await apiReachable(request)), "API not reachable")

    await signupViaApi(request, { fullName: "Owner" })
    await trpcMutationData(request, "collab.grantDevCredits", { amount: 100 })
    const resume = await trpcMutationData<
      { title: string },
      { id: string }
    >(request, "resumes.create", { title: "Shared Doc" })
    const link = await trpcMutationData<
      { kind: string; id: string; role: string },
      { token: string }
    >(request, "collab.createShareLink", {
      kind: "resume",
      id: resume.id,
      role: "edit",
    })

    const ownerTicket = await trpcMutationData<
      { kind: string; id: string },
      WsTicketResult
    >(request, "collab.wsTicket", {
      kind: "resume",
      id: resume.id,
    })
    const ownerWsUrl = ownerTicket.wsUrl || `${E2E_WS_URL}/collab`

    let ownerWs: WebSocket | undefined
    try {
      ownerWs = await holdCollabWs(ownerWsUrl, ownerTicket.ticket)
    } catch (err) {
      test.skip(true, `WS not reachable: ${String(err)}`)
      return
    }

    const guestCtx = await browser.newContext()
    const guestReq = guestCtx.request
    try {
      const guestEmail = uniqueEmail("guest")
      await trpcMutationData(guestReq, "auth.requestOtp", {
        purpose: "signup",
        email: guestEmail,
        fullName: "Guest Editor",
        agreeToTerms: true,
      })
      await trpcMutationData(guestReq, "auth.verifyOtp", {
        purpose: "signup",
        email: guestEmail,
        code: process.env.E2E_OTP_CODE ?? "000000",
      })

      const guestTicket = await trpcMutationData<
        { kind: string; id: string; shareToken: string },
        WsTicketResult
      >(guestReq, "collab.wsTicket", {
        kind: "resume",
        id: resume.id,
        shareToken: link.token,
      })

      expect(guestTicket.role === "edit" || guestTicket.role === "view").toBe(
        true
      )

      const msg = await connectCollabWs(
        guestTicket.wsUrl || `${E2E_WS_URL}/collab`,
        guestTicket.ticket
      )
      expect(msg.type).toBe("snapshot")
      expect(msg.document).toBeTruthy()
    } finally {
      try {
        ownerWs?.close()
      } catch {
        /* ignore */
      }
      await guestCtx.close()
    }
  })
})
