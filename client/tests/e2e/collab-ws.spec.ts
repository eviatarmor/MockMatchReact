import { test, expect } from "@playwright/test"
import {
  E2E_SKIP,
  apiReachable,
  signupViaApi,
  trpcMutationData,
} from "./helpers"

const WS_URL = process.env.E2E_WS_URL ?? "ws://localhost:3001"

type WsTicketResult = {
  ticket: string
  wsUrl: string
  role: string
}

/**
 * Open collab WebSocket with ticket query param; resolve first JSON message.
 */
function connectCollabWs(
  wsUrl: string,
  ticket: string,
  timeoutMs = 15_000
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const url = `${wsUrl.replace(/\/$/, "")}?ticket=${encodeURIComponent(ticket)}`
    // Prefer global WebSocket (Node 22+ / undici); fallback dynamic ws package
    const open = async () => {
      let WSImpl: typeof WebSocket
      if (typeof WebSocket !== "undefined") {
        WSImpl = WebSocket
      } else {
        const mod = await import("ws")
        WSImpl = mod.default as unknown as typeof WebSocket
      }

      const ws = new WSImpl(url)
      const timer = setTimeout(() => {
        try {
          ws.close()
        } catch {
          /* ignore */
        }
        reject(new Error(`collab WS timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      ws.addEventListener("message", (ev) => {
        clearTimeout(timer)
        try {
          const data =
            typeof ev.data === "string" ? ev.data : String(ev.data)
          const msg = JSON.parse(data) as Record<string, unknown>
          try {
            ws.close()
          } catch {
            /* ignore */
          }
          resolve(msg)
        } catch (err) {
          reject(err)
        }
      })
      ws.addEventListener("error", () => {
        clearTimeout(timer)
        reject(new Error("collab WS error event"))
      })
    }
    void open().catch(reject)
  })
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

    // Paid multiplayer not required for solo owner join
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
    const wsUrl = ticketRes.wsUrl || `${WS_URL}/collab`

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

    // First message should be snapshot (or error if infra missing)
    if (msg.type === "error") {
      // Redis/DB issues — surface clearly
      throw new Error(`collab error: ${JSON.stringify(msg)}`)
    }

    expect(msg.type).toBe("snapshot")
    expect(msg.role).toBe("owner")
    expect(msg.document).toBeTruthy()
    expect(msg.self).toBeTruthy()
  })

})

// Second user flow needs isolated cookie jar
test.describe("collab multiplayer share", () => {
  test.skip(E2E_SKIP, "E2E_SKIP=1")

  test("guest joins shared resume while owner WS is live", async ({
    browser,
    request,
  }) => {
    test.skip(!(await apiReachable(request)), "API not reachable")

    // Owner session
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

    // Share links stay active only while owner is in the document — hold WS open
    const ownerTicket = await trpcMutationData<
      { kind: string; id: string },
      WsTicketResult
    >(request, "collab.wsTicket", {
      kind: "resume",
      id: resume.id,
    })
    const ownerWsUrl = ownerTicket.wsUrl || `${WS_URL}/collab`
    let ownerWs: WebSocket | undefined
    try {
      ownerWs = await new Promise<WebSocket>((resolve, reject) => {
        const open = async () => {
          let WSImpl: typeof WebSocket
          if (typeof WebSocket !== "undefined") {
            WSImpl = WebSocket
          } else {
            const mod = await import("ws")
            WSImpl = mod.default as unknown as typeof WebSocket
          }
          const url = `${ownerWsUrl.replace(/\/$/, "")}?ticket=${encodeURIComponent(ownerTicket.ticket)}`
          const ws = new WSImpl(url)
          ws.addEventListener("open", () => resolve(ws))
          ws.addEventListener("error", () =>
            reject(new Error("owner WS open failed"))
          )
          setTimeout(() => reject(new Error("owner WS timeout")), 10_000)
        }
        void open().catch(reject)
      })
    } catch (err) {
      test.skip(true, `WS not reachable: ${String(err)}`)
      return
    }

    const guestCtx = await browser.newContext()
    const guestReq = guestCtx.request
    try {
      const guestEmail = `guest+${Date.now()}@example.com`
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
        guestTicket.wsUrl || `${WS_URL}/collab`,
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
