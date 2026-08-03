/**
 * Collab WebSocket helpers for Playwright E2E.
 */

export type CollabWsOptions = {
  /** Resolve on first JSON message and close (default). */
  mode?: "first-message" | "hold-open"
  timeoutMs?: number
}

function resolveWebSocketImpl(): Promise<typeof WebSocket> {
  if (typeof WebSocket !== "undefined") {
    return Promise.resolve(WebSocket)
  }
  return import("ws").then((mod) => mod.default as unknown as typeof WebSocket)
}

export function collabWsUrl(wsUrl: string, ticket: string): string {
  return `${wsUrl.replace(/\/$/, "")}?ticket=${encodeURIComponent(ticket)}`
}

/**
 * Open collab WS with ticket.
 * - first-message: resolve first JSON payload, then close
 * - hold-open: resolve the open socket (caller must close)
 */
export async function openCollabWs(
  wsUrl: string,
  ticket: string,
  opts: CollabWsOptions = {}
): Promise<Record<string, unknown> | WebSocket> {
  const mode = opts.mode ?? "first-message"
  const timeoutMs = opts.timeoutMs ?? 15_000
  const url = collabWsUrl(wsUrl, ticket)
  const WSImpl = await resolveWebSocketImpl()

  if (mode === "hold-open") {
    return new Promise<WebSocket>((resolve, reject) => {
      const ws = new WSImpl(url)
      const timer = setTimeout(() => {
        try {
          ws.close()
        } catch {
          /* ignore */
        }
        reject(new Error(`collab WS open timeout after ${timeoutMs}ms`))
      }, timeoutMs)
      ws.addEventListener("open", () => {
        clearTimeout(timer)
        resolve(ws)
      })
      ws.addEventListener("error", () => {
        clearTimeout(timer)
        reject(new Error("collab WS error event"))
      })
    })
  }

  return new Promise<Record<string, unknown>>((resolve, reject) => {
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
        const data = typeof ev.data === "string" ? ev.data : String(ev.data)
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
  })
}

/** First JSON message then close. */
export function connectCollabWs(
  wsUrl: string,
  ticket: string,
  timeoutMs = 15_000
): Promise<Record<string, unknown>> {
  return openCollabWs(wsUrl, ticket, {
    mode: "first-message",
    timeoutMs,
  }) as Promise<Record<string, unknown>>
}

/** Keep socket open (owner presence for share links). */
export function holdCollabWs(
  wsUrl: string,
  ticket: string,
  timeoutMs = 10_000
): Promise<WebSocket> {
  return openCollabWs(wsUrl, ticket, {
    mode: "hold-open",
    timeoutMs,
  }) as Promise<WebSocket>
}
