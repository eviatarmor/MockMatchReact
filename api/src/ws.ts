import { randomBytes } from "node:crypto"
import { createServer } from "node:http"
import { WebSocketServer, WebSocket } from "ws"
import type { CollabEffectiveRole, DocumentKind } from "@mockmatch/schemas"
import { env } from "./config/env.js"

/** Unique per process so Redis fan-out does not double-deliver on same pod. */
const INSTANCE_ID = randomBytes(4).toString("hex")
import { db } from "./db/client.js"
import { scheduleCollabFlush } from "./jobs/collab-flush.js"
import {
  applyPathOp,
  assignColor,
  claimSeat,
  getAllPresence,
  memberCount,
  publishRoom,
  releaseSeat,
  seedSnapshotIfMissing,
  setPresence,
  type PresenceRecord,
} from "./lib/collab-store.js"
import { verifyCollabTicket } from "./lib/jwt.js"
import { logger } from "./lib/logger.js"
import { getRedis } from "./lib/redis.js"
import { isPaidUser } from "./modules/billing/credits.js"
import { loadDocumentSnapshot } from "./modules/collab/service.js"
import { canApplyPath } from "./modules/collab/permissions.js"

type ClientState = {
  ws: WebSocket
  userId: string
  name: string
  email: string
  kind: DocumentKind
  documentId: string
  role: CollabEffectiveRole
  ownerUserId: string
  color: string
  roomKey: string
}

const clients = new Set<ClientState>()

function roomKey(kind: DocumentKind, id: string): string {
  return `${kind}:${id}`
}

const MAX_SELECTION_RECTS = 32

/** Clamp peer selection highlight boxes (normalized 0–1). */
function sanitizeSelectionRects(
  raw: unknown
): Array<{ x: number; y: number; w: number; h: number }> {
  if (!Array.isArray(raw)) return []
  const out: Array<{ x: number; y: number; w: number; h: number }> = []
  for (const item of raw) {
    if (out.length >= MAX_SELECTION_RECTS) break
    if (!item || typeof item !== "object") continue
    const r = item as Record<string, unknown>
    const x = Number(r.x)
    const y = Number(r.y)
    const w = Number(r.w)
    const h = Number(r.h)
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(w) ||
      !Number.isFinite(h)
    ) {
      continue
    }
    if (w <= 0 || h <= 0) continue
    out.push({
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
      w: Math.min(1, Math.max(0, w)),
      h: Math.min(1, Math.max(0, h)),
    })
  }
  return out
}

function send(ws: WebSocket, msg: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

function localBroadcast(
  kind: DocumentKind,
  documentId: string,
  msg: unknown,
  exceptUserId?: string
): void {
  const key = roomKey(kind, documentId)
  for (const c of clients) {
    if (c.roomKey !== key) continue
    if (exceptUserId && c.userId === exceptUserId) continue
    send(c.ws, msg)
  }
}

async function fanout(
  kind: DocumentKind,
  documentId: string,
  msg: unknown,
  exceptUserId?: string
): Promise<void> {
  // Local first (same pod)
  localBroadcast(kind, documentId, msg, exceptUserId)
  // Cross-pod via Redis
  await publishRoom(kind, documentId, {
    ...((msg as object) ?? {}),
    _exceptUserId: exceptUserId,
    _origin: INSTANCE_ID,
  })
}

async function ensureSnapshot(kind: DocumentKind, documentId: string) {
  const seed = await loadDocumentSnapshot(db, kind, documentId)
  if (!seed) return null
  return seedSnapshotIfMissing(kind, documentId, {
    ownerUserId: seed.ownerUserId,
    title: seed.title,
    templateId: seed.templateId,
    style: seed.style,
    document: seed.document,
    updatedAt: seed.updatedAt,
  })
}

async function handleJoin(state: ClientState): Promise<void> {
  const { kind, documentId, userId, role, ownerUserId, name } = state

  // Multiplayer peers require paid owner (solo owner always OK)
  if (role !== "owner") {
    const paid = await isPaidUser(db, ownerUserId)
    if (!paid) {
      send(state.ws, {
        type: "error",
        code: "owner_unpaid",
        message: "Owner no longer has collaboration enabled.",
      })
      state.ws.close()
      return
    }
  } else {
    // Second seat requires paid owner
    const count = await memberCount(kind, documentId)
    if (count >= 1) {
      const paid = await isPaidUser(db, ownerUserId)
      if (!paid) {
        // Owner alone still fine — only block additional if somehow
      }
    }
  }

  const claimed = await claimSeat(kind, documentId, userId)
  if (!claimed) {
    send(state.ws, {
      type: "error",
      code: "room_full",
      message: "This document already has 3 people editing.",
    })
    state.ws.close()
    return
  }

  // Extra defense: if claiming would make members > 1 and owner unpaid, release
  const count = await memberCount(kind, documentId)
  if (count > 1) {
    const paid = await isPaidUser(db, ownerUserId)
    if (!paid) {
      await releaseSeat(kind, documentId, userId)
      send(state.ws, {
        type: "error",
        code: "owner_unpaid",
        message: "Multiplayer collaboration requires a paid owner account.",
      })
      state.ws.close()
      return
    }
  }

  const snapshot = await ensureSnapshot(kind, documentId)
  if (!snapshot) {
    await releaseSeat(kind, documentId, userId)
    send(state.ws, {
      type: "error",
      code: "not_found",
      message: "Document not found.",
    })
    state.ws.close()
    return
  }

  const color = await assignColor(kind, documentId, userId)
  state.color = color

  const presence: PresenceRecord = {
    userId,
    name,
    color,
    role,
    lastSeen: Date.now(),
  }
  await setPresence(kind, documentId, presence)

  const peers = (await getAllPresence(kind, documentId)).filter(
    (p) => p.userId !== userId
  )

  send(state.ws, {
    type: "snapshot",
    rev: snapshot.rev,
    title: snapshot.title,
    templateId: snapshot.templateId,
    style: snapshot.style,
    document: snapshot.document,
    role,
    color,
    self: { userId, name, color, role },
    peers,
  })

  await fanout(
    kind,
    documentId,
    { type: "peer.joined", peer: presence },
    userId
  )
}

async function handleLeave(state: ClientState): Promise<void> {
  const { kind, documentId, userId } = state
  const remaining = await releaseSeat(kind, documentId, userId)
  await fanout(
    kind,
    documentId,
    { type: "peer.left", userId },
    userId
  )
  // Last peer → immediate Postgres flush
  if (remaining === 0) {
    await scheduleCollabFlush(kind, documentId, { immediate: true })
  }
}

async function handleMessage(state: ClientState, raw: string): Promise<void> {
  let msg: Record<string, unknown>
  try {
    msg = JSON.parse(raw) as Record<string, unknown>
  } catch {
    send(state.ws, { type: "error", code: "bad_json", message: "Invalid JSON" })
    return
  }

  const type = msg.type
  const { kind, documentId, userId, role, name, color } = state

  if (type === "presence.heartbeat") {
    await setPresence(kind, documentId, {
      userId,
      name,
      color,
      role,
      lastSeen: Date.now(),
    })
    return
  }

  if (type === "presence.cursor") {
    if (msg.clear === true) {
      await setPresence(kind, documentId, {
        userId,
        name,
        color,
        role,
        lastSeen: Date.now(),
      })
      await fanout(
        kind,
        documentId,
        {
          type: "presence.cursor",
          userId,
          name,
          color,
          clear: true,
        },
        userId
      )
      return
    }
    const x = Number(msg.x)
    const y = Number(msg.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    const nx = Math.min(1, Math.max(0, x))
    const ny = Math.min(1, Math.max(0, y))
    const kindCursor =
      msg.kind === "caret"
        ? "caret"
        : msg.kind === "selection"
          ? "selection"
          : "pointer"
    const h = Number(msg.h)
    const rects = sanitizeSelectionRects(msg.rects)
    const cursorPayload = {
      x: nx,
      y: ny,
      kind: kindCursor as "pointer" | "caret" | "selection",
      ...(Number.isFinite(h) && h > 0 ? { h } : {}),
      ...(rects.length > 0 ? { rects } : {}),
    }
    await setPresence(kind, documentId, {
      userId,
      name,
      color,
      role,
      lastSeen: Date.now(),
      cursor: cursorPayload,
    })
    await fanout(
      kind,
      documentId,
      {
        type: "presence.cursor",
        userId,
        name,
        color,
        ...cursorPayload,
      },
      userId
    )
    return
  }

  if (type === "doc.op" || type === "meta.patch") {
    const path = String(msg.path ?? "")
    if (!path) {
      send(state.ws, {
        type: "error",
        code: "bad_op",
        message: "Missing path",
      })
      return
    }
    if (!canApplyPath(role, path)) {
      send(state.ws, {
        type: "error",
        code: "forbidden_role",
        message: "Your role cannot edit this field.",
      })
      return
    }

    const snapshot = await applyPathOp(kind, documentId, path, msg.value, userId)
    if (!snapshot) {
      send(state.ws, {
        type: "error",
        code: "no_snapshot",
        message: "Room not ready",
      })
      return
    }

    // Fan-out FIRST so peers see keystrokes immediately — do not wait on Postgres flush queue
    await fanout(kind, documentId, {
      type: "doc.op",
      path,
      value: msg.value,
      rev: snapshot.rev,
      userId,
    })

    // Background durable flush (Redis → Postgres)
    void scheduleCollabFlush(kind, documentId)
    return
  }

  if (type === "leave") {
    await handleLeave(state)
    state.ws.close()
  }
}

function startPubSubBridge(): void {
  const sub = getRedis().duplicate()
  sub.subscribe("__keyspace@0__dummy").catch(() => {})
  // Pattern subscribe all collab rooms by listening via psubscribe
  void sub.psubscribe("collab:room:*")

  sub.on("pmessage", (_pattern, channel, message) => {
    try {
      const msg = JSON.parse(message) as Record<string, unknown>
      const origin = msg._origin
      // Skip messages we published if we can detect — still re-deliver to local
      // clients from other pods only. Same-pod already localBroadcast.
      if (origin === INSTANCE_ID) return

      const parts = channel.split(":")
      // collab:room:kind:id
      const kind = parts[2] as DocumentKind
      const documentId = parts[3]
      if (!kind || !documentId) return

      const exceptUserId =
        typeof msg._exceptUserId === "string" ? msg._exceptUserId : undefined
      const clean = { ...msg }
      delete clean._exceptUserId
      delete clean._origin
      localBroadcast(kind, documentId, clean, exceptUserId)
    } catch (err) {
      logger.error({ err }, "collab pubsub message error")
    }
  })

  logger.info("collab redis pub/sub bridge ready")
}

function parseTicketFromUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url, "http://localhost")
    return u.searchParams.get("ticket")
  } catch {
    return null
  }
}

export function startCollabWsServer(): void {
  const server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("mockmatch collab ws\n")
  })

  const wss = new WebSocketServer({ server, path: "/collab" })

  startPubSubBridge()

  wss.on("connection", async (ws, req) => {
    const ticket = parseTicketFromUrl(req.url)
    if (!ticket) {
      send(ws, {
        type: "error",
        code: "unauthorized",
        message: "Missing collab ticket",
      })
      ws.close()
      return
    }

    let payload
    try {
      payload = await verifyCollabTicket(ticket)
    } catch {
      send(ws, {
        type: "error",
        code: "unauthorized",
        message: "Invalid or expired collab ticket",
      })
      ws.close()
      return
    }

    const state: ClientState = {
      ws,
      userId: payload.sub,
      name: payload.name,
      email: payload.email,
      kind: payload.kind as DocumentKind,
      documentId: payload.documentId,
      role: payload.role as CollabEffectiveRole,
      ownerUserId: payload.ownerUserId,
      color: "#3B82F6",
      roomKey: roomKey(payload.kind as DocumentKind, payload.documentId),
    }
    clients.add(state)

    try {
      await handleJoin(state)
    } catch (err) {
      logger.error({ err }, "collab join failed")
      send(ws, {
        type: "error",
        code: "join_failed",
        message: "Failed to join room",
      })
      ws.close()
    }

    ws.on("message", (data) => {
      void handleMessage(state, data.toString()).catch((err) => {
        logger.error({ err }, "collab message handler error")
      })
    })

    ws.on("close", () => {
      clients.delete(state)
      void handleLeave(state).catch((err) => {
        logger.error({ err }, "collab leave error")
      })
    })

    ws.on("error", (err) => {
      logger.error({ err }, "collab ws error")
    })
  })

  server.listen(env.WS_PORT, () => {
    logger.info(
      { port: env.WS_PORT, url: env.WS_URL },
      "collab websocket server listening"
    )
  })
}

// Entrypoint when run as `tsx src/ws.ts`
startCollabWsServer()
