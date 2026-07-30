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
  applyYjsUpdate,
  assignColor,
  claimSeat,
  decodeYUpdateBase64,
  encodeYUpdateBase64,
  ensureYjsState,
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
import {
  abortSandboxRun,
  executeSandboxRun,
  isSandboxRunActive,
  sanitizeSandboxFiles,
  type SandboxMode,
} from "./lib/sandbox-runner.js"
import {
  closeAllPtyForDocument,
  closePtySession,
  openPtySession,
  resizePtySession,
  writePtySession,
} from "./lib/sandbox-pty.js"
import { stopSessionSandbox } from "./lib/sandbox-session.js"
import { assertAppTierSandboxConfig } from "./modules/sandbox/client.js"

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
  /** Prevent double handleLeave (leave msg + socket close). */
  left?: boolean
}

const clients = new Set<ClientState>()

function roomKey(kind: DocumentKind, id: string): string {
  return `${kind}:${id}`
}

const MAX_SELECTION_RECTS = 32
const MAX_CURSOR_PATH_LEN = 512

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

function sanitizeCursorPath(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined
  const path = raw.trim()
  if (!path || path.length > MAX_CURSOR_PATH_LEN) return undefined
  return path
}

function sanitizeMonacoSel(raw: unknown):
  | {
      startLineNumber: number
      startColumn: number
      endLineNumber: number
      endColumn: number
    }
  | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const s = raw as Record<string, unknown>
  const startLineNumber = Math.floor(Number(s.startLineNumber))
  const startColumn = Math.floor(Number(s.startColumn))
  const endLineNumber = Math.floor(Number(s.endLineNumber))
  const endColumn = Math.floor(Number(s.endColumn))
  if (
    !Number.isFinite(startLineNumber) ||
    !Number.isFinite(startColumn) ||
    !Number.isFinite(endLineNumber) ||
    !Number.isFinite(endColumn)
  ) {
    return undefined
  }
  if (
    startLineNumber < 1 ||
    startColumn < 1 ||
    endLineNumber < 1 ||
    endColumn < 1
  ) {
    return undefined
  }
  return {
    startLineNumber: Math.min(startLineNumber, 1_000_000),
    startColumn: Math.min(startColumn, 100_000),
    endLineNumber: Math.min(endLineNumber, 1_000_000),
    endColumn: Math.min(endColumn, 100_000),
  }
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

  // Yjs full state for CRDT sync (seeded from JSON snapshot when empty)
  try {
    const yState = await ensureYjsState(kind, documentId, {
      title: snapshot.title,
      templateId: snapshot.templateId,
      style: snapshot.style,
      document: snapshot.document,
    })
    send(state.ws, {
      type: "yjs.sync",
      update: encodeYUpdateBase64(yState),
      rev: snapshot.rev,
    })
  } catch (err) {
    logger.error({ err, kind, documentId }, "yjs.sync seed failed")
  }

  await fanout(
    kind,
    documentId,
    { type: "peer.joined", peer: presence },
    userId
  )
}

async function handleLeave(state: ClientState): Promise<void> {
  if (state.left) return
  state.left = true

  const { kind, documentId, userId, role } = state
  // Drop this peer's interactive sandbox shell
  closePtySession(documentId, userId)
  const remaining = await releaseSeat(kind, documentId, userId)
  await fanout(
    kind,
    documentId,
    { type: "peer.left", userId },
    userId
  )

  // Owner left → end session for everyone, revoke share links, drop peer sockets.
  // Reopening later does not revive links; owner must create a new share.
  if (role === "owner") {
    closeAllPtyForDocument(documentId)
    abortSandboxRun(documentId)
    void stopSessionSandbox(documentId)
    const closedMsg = { type: "room.closed" as const, reason: "owner_left" as const }
    await fanout(kind, documentId, closedMsg, userId)

    const key = roomKey(kind, documentId)
    for (const c of [...clients]) {
      if (c.roomKey !== key || c.userId === userId) continue
      try {
        send(c.ws, closedMsg)
        c.ws.close()
      } catch {
        // ignore
      }
      // releaseSeat runs again in peer's own handleLeave on close
    }

    try {
      const { revokeAllShareLinksForDocument } = await import(
        "./modules/collab/service.js"
      )
      const n = await revokeAllShareLinksForDocument(db, kind, documentId)
      if (n > 0) {
        logger.info(
          { kind, documentId, revoked: n },
          "collab share links revoked — owner left room"
        )
      }
    } catch (err) {
      logger.error({ err, kind, documentId }, "failed to revoke share links on owner leave")
    }

    // Owner gone → flush whatever is left
    await scheduleCollabFlush(kind, documentId, { immediate: true })
    return
  }

  // Last peer → tear down session sandbox + immediate Postgres flush
  if (remaining === 0) {
    closeAllPtyForDocument(documentId)
    abortSandboxRun(documentId)
    void stopSessionSandbox(documentId)
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
    // Paper-relative coords — allow outside [0,1] so peers see cursors on the grid
    const nx = Math.min(4, Math.max(-4, x))
    const ny = Math.min(4, Math.max(-4, y))
    const kindCursor =
      msg.kind === "caret"
        ? "caret"
        : msg.kind === "selection"
          ? "selection"
          : "pointer"
    const h = Number(msg.h)
    const rects = sanitizeSelectionRects(msg.rects)
    const path = sanitizeCursorPath(msg.path)
    const sel = sanitizeMonacoSel(msg.sel)
    const cursorPayload = {
      x: nx,
      y: ny,
      kind: kindCursor as "pointer" | "caret" | "selection",
      ...(Number.isFinite(h) && h > 0 ? { h } : {}),
      ...(rects.length > 0 ? { rects } : {}),
      ...(path ? { path } : {}),
      ...(sel ? { sel } : {}),
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

  if (type === "yjs.update") {
    if (role === "view") {
      send(state.ws, {
        type: "error",
        code: "forbidden_role",
        message: "Your role cannot edit this document.",
      })
      return
    }
    const raw = typeof msg.update === "string" ? msg.update : ""
    if (!raw || raw.length > 2_000_000) {
      send(state.ws, {
        type: "error",
        code: "bad_op",
        message: "Invalid yjs update",
      })
      return
    }
    let update: Uint8Array
    try {
      update = decodeYUpdateBase64(raw)
    } catch {
      send(state.ws, {
        type: "error",
        code: "bad_op",
        message: "Invalid yjs update encoding",
      })
      return
    }

    // edit role: content only — strip design axes after merge
    const lockDesign = role === "edit"
    const snapshot = await applyYjsUpdate(
      kind,
      documentId,
      update,
      userId,
      lockDesign
    )
    if (!snapshot) {
      send(state.ws, {
        type: "error",
        code: "no_snapshot",
        message: "Room not ready",
      })
      return
    }

    await fanout(kind, documentId, {
      type: "yjs.update",
      update: raw,
      rev: snapshot.rev,
      userId,
    })
    void scheduleCollabFlush(kind, documentId)
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

  if (type === "sandbox.run") {
    // Workspace sandbox only (dev workspace collab room)
    if (kind !== "workspace") {
      send(state.ws, {
        type: "error",
        code: "sandbox_unsupported",
        message: "Sandbox run is only available for workspaces.",
      })
      return
    }

    if (isSandboxRunActive(documentId)) {
      send(state.ws, {
        type: "sandbox.busy",
        message: "A sandbox run is already in progress.",
      })
      return
    }

    const mode: SandboxMode = msg.mode === "tests" ? "tests" : "run"
    const entryPath =
      typeof msg.entryPath === "string" ? msg.entryPath : undefined

    let files: Record<string, string> = {}
    const fromClient = sanitizeSandboxFiles(msg.files)
    if (!fromClient.error && Object.keys(fromClient.files).length > 0) {
      files = fromClient.files
    } else {
      // Fall back to Redis snapshot when client omitted / empty payload
      const snap = await ensureSnapshot(kind, documentId)
      const doc = snap?.document as
        | { files?: Record<string, { content?: string } | string> }
        | undefined
      const fromSnap: Record<string, string> = {}
      if (doc?.files && typeof doc.files === "object") {
        for (const [p, entry] of Object.entries(doc.files)) {
          if (typeof entry === "string") fromSnap[p] = entry
          else if (entry && typeof entry.content === "string") {
            fromSnap[p] = entry.content
          }
        }
      }
      const cleaned = sanitizeSandboxFiles(fromSnap)
      if (cleaned.error || Object.keys(cleaned.files).length === 0) {
        await fanout(kind, documentId, {
          type: "sandbox.finished",
          runId: "none",
          exitCode: null,
          error:
            fromClient.error ?? cleaned.error ?? "No files to run",
          mode,
        })
        return
      }
      files = cleaned.files
    }

    let streamRunId = "pending"
    const result = await executeSandboxRun(
      {
        sessionId: documentId,
        userId,
        role,
        mode,
        entryPath,
        files,
      },
      {
        onStart: async ({ runId, command }) => {
          streamRunId = runId
          await fanout(kind, documentId, {
            type: "sandbox.started",
            runId,
            mode,
            userId,
            command,
          })
        },
        onStdout: (chunk) => {
          void fanout(kind, documentId, {
            type: "sandbox.output",
            runId: streamRunId,
            stream: "stdout",
            chunk,
          })
        },
        onStderr: (chunk) => {
          void fanout(kind, documentId, {
            type: "sandbox.output",
            runId: streamRunId,
            stream: "stderr",
            chunk,
          })
        },
      }
    )

    // Validation errors never called onStart — still notify room
    if (!result.command && result.error) {
      await fanout(kind, documentId, {
        type: "sandbox.finished",
        runId: result.runId,
        exitCode: null,
        error: result.error,
        command: result.command,
        mode,
      })
      return
    }

    await fanout(kind, documentId, {
      type: "sandbox.finished",
      runId: result.runId,
      exitCode: result.exitCode,
      error: result.error,
      command: result.command,
      mode,
    })
    return
  }

  // ── Interactive PTY shell (SSH-like, per peer) ──────────────────────────
  if (type === "sandbox.pty.open") {
    if (kind !== "workspace") {
      send(state.ws, {
        type: "sandbox.pty.error",
        message: "Sandbox shell is only available for workspaces.",
      })
      return
    }

    let files: Record<string, string> | undefined
    const fromClient = sanitizeSandboxFiles(msg.files)
    if (!fromClient.error && Object.keys(fromClient.files).length > 0) {
      files = fromClient.files
    } else {
      const snap = await ensureSnapshot(kind, documentId)
      const doc = snap?.document as
        | { files?: Record<string, { content?: string } | string> }
        | undefined
      if (doc?.files && typeof doc.files === "object") {
        const fromSnap: Record<string, string> = {}
        for (const [p, entry] of Object.entries(doc.files)) {
          if (typeof entry === "string") fromSnap[p] = entry
          else if (entry && typeof entry.content === "string") {
            fromSnap[p] = entry.content
          }
        }
        const cleaned = sanitizeSandboxFiles(fromSnap)
        if (!cleaned.error && Object.keys(cleaned.files).length > 0) {
          files = cleaned.files
        }
      }
    }

    const cols = Number(msg.cols)
    const rows = Number(msg.rows)
    const result = await openPtySession({
      documentId,
      userId,
      role,
      files,
      cols: Number.isFinite(cols) ? cols : 80,
      rows: Number.isFinite(rows) ? rows : 24,
      handlers: {
        onData: (chunk) => {
          send(state.ws, { type: "sandbox.pty.output", data: chunk })
        },
        onExit: (code) => {
          send(state.ws, { type: "sandbox.pty.exit", code })
        },
        onError: (message) => {
          send(state.ws, { type: "sandbox.pty.error", message })
        },
      },
    })

    if (!result.ok) {
      send(state.ws, {
        type: "sandbox.pty.error",
        message: result.error,
      })
      return
    }

    send(state.ws, { type: "sandbox.pty.ready" })
    return
  }

  if (type === "sandbox.pty.input") {
    if (kind !== "workspace") return
    const data = typeof msg.data === "string" ? msg.data : ""
    if (!data || data.length > 16_384) return
    writePtySession(documentId, userId, data)
    return
  }

  if (type === "sandbox.pty.resize") {
    if (kind !== "workspace") return
    const cols = Number(msg.cols)
    const rows = Number(msg.rows)
    if (!Number.isFinite(cols) || !Number.isFinite(rows)) return
    // Resize injects stty — skip to avoid noise; only apply if both sensible
    if (cols >= 20 && rows >= 5) {
      // Soft-resize only when client reports size (best-effort)
      resizePtySession(documentId, userId, cols, rows)
    }
    return
  }

  if (type === "sandbox.pty.close") {
    closePtySession(documentId, userId)
    return
  }

  if (type === "leave") {
    await handleLeave(state)
    state.ws.close()
  }
}

/**
 * Force-disconnect a user from a live room (share dialog remove).
 * Sends access.revoked so the client does not auto-reconnect as editor.
 */
function kickLocalUser(
  kind: DocumentKind,
  documentId: string,
  targetUserId: string,
  reason: string
): void {
  const key = roomKey(kind, documentId)
  for (const c of [...clients]) {
    if (c.roomKey !== key || c.userId !== targetUserId) continue
    try {
      send(c.ws, {
        type: "access.revoked",
        reason,
      })
      c.ws.close()
    } catch {
      // ignore
    }
  }
}

/** Update live ticket role (edit → view) so further yjs updates are rejected. */
function applyLocalRole(
  kind: DocumentKind,
  documentId: string,
  targetUserId: string,
  role: CollabEffectiveRole
): void {
  const key = roomKey(kind, documentId)
  for (const c of clients) {
    if (c.roomKey !== key || c.userId !== targetUserId) continue
    c.role = role
    send(c.ws, { type: "role.updated", role })
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

      // API control plane (kick / live role) — handle on this pod, do not
      // re-broadcast raw control frames to every client.
      if (msg.type === "peer.kick") {
        const target = typeof msg.userId === "string" ? msg.userId : ""
        if (target) {
          kickLocalUser(
            kind,
            documentId,
            target,
            typeof msg.reason === "string" ? msg.reason : "removed"
          )
        }
        return
      }
      if (msg.type === "peer.role") {
        const target = typeof msg.userId === "string" ? msg.userId : ""
        const role = msg.role
        if (
          target &&
          (role === "view" || role === "edit" || role === "owner")
        ) {
          applyLocalRole(kind, documentId, target, role)
        }
        return
      }

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
  try {
    assertAppTierSandboxConfig()
  } catch (err) {
    logger.error({ err }, "sandbox production config invalid")
    throw err
  }

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
