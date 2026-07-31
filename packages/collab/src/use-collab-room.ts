import { useCallback, useEffect, useRef, useState } from "react"
import type { DocumentKind } from "@mockmatch/schemas"
import { permissionsForRole } from "./permissions"
import type {
  CollabCursorKind,
  CollabNormRect,
  CollabPeer,
  CollabSaveStatus,
  CollabServerMessage,
  CollabEffectiveRole,
  CollabPermissions,
} from "./types"
import type { SendCursorMeta } from "./use-collab-surface"

const HEARTBEAT_MS = 15_000
const CURSOR_THROTTLE_MS = 40
const RECONNECT_MS = 1_500
/** Settle "Saving…" → "Saved" after last op ack (avoids flicker while typing). */
const DOC_SAVED_SETTLE_MS = 350

type SnapshotPayload = {
  rev: number
  title: string
  templateId: string
  style: Record<string, unknown>
  document: unknown
}

/** Host-issued WS ticket (e.g. tRPC `collab.wsTicket`). */
export type CollabWsTicket = {
  readonly ticket: string
  readonly wsUrl: string
  readonly role: CollabEffectiveRole
}

export type FetchCollabTicket = (args: {
  kind: DocumentKind
  documentId: string
  shareToken?: string | null
}) => Promise<CollabWsTicket>

interface UseCollabRoomArgs {
  readonly kind: DocumentKind
  readonly documentId: string
  /** Injected ticket fetch — keeps this package free of tRPC. */
  readonly fetchTicket: FetchCollabTicket
  readonly enabled?: boolean
  readonly shareToken?: string | null
  readonly onRemoteOp?: (path: string, value: unknown, userId: string) => void
  readonly onSnapshot?: (snap: SnapshotPayload, role: CollabEffectiveRole) => void
  /** Yjs full-state sync on join (preferred over path ops for live editing). */
  readonly onYjsSync?: (updateB64: string, rev: number) => void
  /** Incremental remote Yjs update (skip own echo via userId). */
  readonly onYjsUpdate?: (updateB64: string, userId: string, rev: number) => void
}

export function useCollabRoom({
  kind,
  documentId,
  fetchTicket,
  enabled = true,
  shareToken,
  onRemoteOp,
  onSnapshot,
  onYjsSync,
  onYjsUpdate,
}: UseCollabRoomArgs) {
  const [status, setStatus] = useState<CollabSaveStatus>("idle")
  /** Document persist indicator — independent of room connection status. */
  const [docSaveStatus, setDocSaveStatus] = useState<"saved" | "saving">("saved")
  const [peers, setPeers] = useState<CollabPeer[]>([])
  const [self, setSelf] = useState<CollabPeer | null>(null)
  const [role, setRole] = useState<CollabEffectiveRole>("owner")
  const [roomError, setRoomError] = useState<string | null>(null)
  const [rev, setRev] = useState(0)
  /** Bumps only on peer doc.op — remount paper so live text always shows. */
  const [remoteEpoch, setRemoteEpoch] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const selfIdRef = useRef<string | null>(null)
  const onRemoteOpRef = useRef(onRemoteOp)
  const onSnapshotRef = useRef(onSnapshot)
  const onYjsSyncRef = useRef(onYjsSync)
  const onYjsUpdateRef = useRef(onYjsUpdate)
  const fetchTicketRef = useRef(fetchTicket)
  onRemoteOpRef.current = onRemoteOp
  onSnapshotRef.current = onSnapshot
  onYjsSyncRef.current = onYjsSync
  onYjsUpdateRef.current = onYjsUpdate
  fetchTicketRef.current = fetchTicket

  const lastCursorSent = useRef(0)
  const docSavedTimerRef = useRef<number | undefined>(undefined)
  const pendingOpsRef = useRef(0)
  /** Owner ended the session — do not reconnect. */
  const roomClosedRef = useRef(false)
  /** True after yjs.sync applied this connection. */
  const yjsSyncedRef = useRef(false)
  const yjsFallbackTimerRef = useRef<number | undefined>(undefined)

  const permissions: CollabPermissions = permissionsForRole(role)

  const markDocSaving = useCallback(() => {
    setStatus("synced")
    setDocSaveStatus("saving")
    pendingOpsRef.current += 1
    if (docSavedTimerRef.current) {
      window.clearTimeout(docSavedTimerRef.current)
      docSavedTimerRef.current = undefined
    }
    docSavedTimerRef.current = window.setTimeout(() => {
      if (pendingOpsRef.current > 0) {
        pendingOpsRef.current = 0
        setDocSaveStatus("saved")
      }
    }, 5_000)
  }, [])

  const settleOwnAck = useCallback(() => {
    pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1)
    if (pendingOpsRef.current === 0) {
      if (docSavedTimerRef.current) {
        window.clearTimeout(docSavedTimerRef.current)
      }
      docSavedTimerRef.current = window.setTimeout(() => {
        setDocSaveStatus("saved")
        docSavedTimerRef.current = undefined
      }, DOC_SAVED_SETTLE_MS)
    }
  }, [])

  const handleMessage = useCallback((raw: string) => {
    let msg: CollabServerMessage
    try {
      msg = JSON.parse(raw) as CollabServerMessage
    } catch {
      return
    }

    if (msg.type === "snapshot") {
      selfIdRef.current = msg.self.userId
      setSelf(msg.self)
      setRole(msg.role)
      setPeers(msg.peers)
      setRev(msg.rev)
      yjsSyncedRef.current = false
      // Stay "connecting" until yjs.sync — client must apply server CRDT state
      // before broadcasting, or local JSON seed diverges from peers.
      setStatus("connecting")
      setDocSaveStatus("saved")
      pendingOpsRef.current = 0
      if (docSavedTimerRef.current) {
        window.clearTimeout(docSavedTimerRef.current)
        docSavedTimerRef.current = undefined
      }
      if (yjsFallbackTimerRef.current) {
        window.clearTimeout(yjsFallbackTimerRef.current)
      }
      // If yjs.sync never arrives (server error), still go live so host can seed.
      yjsFallbackTimerRef.current = window.setTimeout(() => {
        if (!yjsSyncedRef.current && !roomClosedRef.current) {
          setStatus("synced")
        }
      }, 2_500)
      setRoomError(null)
      onSnapshotRef.current?.(
        {
          rev: msg.rev,
          title: msg.title,
          templateId: msg.templateId,
          style: msg.style,
          document: msg.document,
        },
        msg.role
      )
      return
    }

    if (msg.type === "yjs.sync") {
      setRev(msg.rev)
      yjsSyncedRef.current = true
      if (yjsFallbackTimerRef.current) {
        window.clearTimeout(yjsFallbackTimerRef.current)
        yjsFallbackTimerRef.current = undefined
      }
      onYjsSyncRef.current?.(msg.update, msg.rev)
      // Live only after shared Y.Doc state is applied
      setStatus("synced")
      return
    }

    if (msg.type === "room.closed") {
      roomClosedRef.current = true
      setStatus("room_closed")
      setRoomError(
        msg.reason === "owner_left"
          ? "The owner left this document. Collaboration has ended."
          : "This collaboration session has ended."
      )
      setPeers([])
      try {
        wsRef.current?.close()
      } catch {
        // ignore
      }
      return
    }

    if (msg.type === "access.revoked") {
      // Owner removed us from share dialog — do not reconnect.
      roomClosedRef.current = true
      setStatus("room_closed")
      setRoomError(
        msg.reason === "removed"
          ? "You were removed from this document."
          : "Your access to this document was revoked."
      )
      setPeers([])
      try {
        wsRef.current?.close()
      } catch {
        // ignore
      }
      return
    }

    if (msg.type === "role.updated") {
      setRole(msg.role)
      setSelf((prev) => (prev ? { ...prev, role: msg.role } : prev))
      return
    }

    if (msg.type === "yjs.update") {
      setRev(msg.rev)
      setStatus("synced")
      if (msg.userId === selfIdRef.current) {
        settleOwnAck()
        return
      }
      onYjsUpdateRef.current?.(msg.update, msg.userId, msg.rev)
      setRemoteEpoch((e) => e + 1)
      return
    }

    if (msg.type === "peer.joined") {
      setPeers((prev) => {
        if (prev.some((p) => p.userId === msg.peer.userId)) return prev
        return [...prev, msg.peer]
      })
      return
    }

    if (msg.type === "peer.left") {
      setPeers((prev) => prev.filter((p) => p.userId !== msg.userId))
      return
    }

    if (msg.type === "presence.cursor") {
      setPeers((prev) => {
        if (msg.clear) {
          return prev.map((p) =>
            p.userId === msg.userId
              ? { ...p, name: msg.name, color: msg.color, cursor: undefined }
              : p
          )
        }
        if (msg.x == null || msg.y == null) return prev
        const nextCursor = {
          x: msg.x,
          y: msg.y,
          kind: msg.kind ?? ("pointer" as const),
          h: msg.h,
          ...(msg.rects && msg.rects.length > 0 ? { rects: msg.rects } : {}),
          ...(msg.path ? { path: msg.path } : {}),
          ...(msg.sel ? { sel: msg.sel } : {}),
        }
        const existing = prev.find((p) => p.userId === msg.userId)
        if (existing) {
          return prev.map((p) =>
            p.userId === msg.userId
              ? { ...p, name: msg.name, color: msg.color, cursor: nextCursor }
              : p
          )
        }
        // Peer might not be in list yet — still show cursor
        return [
          ...prev,
          {
            userId: msg.userId,
            name: msg.name,
            color: msg.color,
            role: "edit" as const,
            cursor: nextCursor,
          },
        ]
      })
      return
    }

    if (msg.type === "doc.op") {
      setRev(msg.rev)
      setStatus("synced")
      // Own op echo → count down pending; settle badge after a short quiet window.
      if (msg.userId === selfIdRef.current) {
        settleOwnAck()
      }
      // Apply peer ops only (skip own echo). Bump remoteEpoch so UI remounts fields.
      if (msg.userId !== selfIdRef.current) {
        onRemoteOpRef.current?.(msg.path, msg.value, msg.userId)
        setRemoteEpoch((e) => e + 1)
      }
      return
    }

    if (msg.type === "error") {
      if (msg.code === "room_full") {
        setStatus("room_full")
        setRoomError(msg.message)
        return
      }
      if (msg.code === "room_closed" || msg.code === "owner_left") {
        roomClosedRef.current = true
        setStatus("room_closed")
        setRoomError(msg.message)
        try {
          wsRef.current?.close()
        } catch {
          // ignore
        }
        return
      }
      setStatus("error")
      setRoomError(msg.message)
    }
  }, [settleOwnAck])

  useEffect(() => {
    if (!enabled || !documentId) return

    let closed = false
    let heartbeat: number | undefined
    let reconnectTimer: number | undefined
    let socket: WebSocket | null = null
    roomClosedRef.current = false

    const connect = async () => {
      if (closed || roomClosedRef.current) return
      setStatus("connecting")
      setDocSaveStatus("saved")
      pendingOpsRef.current = 0
      try {
        const ticket = await fetchTicketRef.current({
          kind,
          documentId,
          shareToken: shareToken || undefined,
        })
        if (closed || roomClosedRef.current) return

        const url = new URL(ticket.wsUrl)
        url.searchParams.set("ticket", ticket.ticket)
        socket = new WebSocket(url.toString())
        wsRef.current = socket

        socket.onopen = () => {
          if (closed || roomClosedRef.current) return
          setRole(ticket.role)
          heartbeat = window.setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "presence.heartbeat" }))
            }
          }, HEARTBEAT_MS)
        }

        socket.onmessage = (ev) => handleMessage(String(ev.data))

        socket.onclose = () => {
          wsRef.current = null
          if (heartbeat) window.clearInterval(heartbeat)
          if (closed || roomClosedRef.current) return
          setStatus("connecting")
          reconnectTimer = window.setTimeout(() => {
            void connect()
          }, RECONNECT_MS)
        }

        socket.onerror = () => {
          if (roomClosedRef.current) return
          setStatus("error")
        }
      } catch (err) {
        if (closed || roomClosedRef.current) return
        const message =
          err instanceof Error ? err.message : "Failed to connect to collaboration"
        if (message.toLowerCase().includes("3 people") || message.includes("room")) {
          setStatus("room_full")
        } else {
          setStatus("error")
        }
        setRoomError(message)
        if (!closed && !roomClosedRef.current) {
          reconnectTimer = window.setTimeout(() => {
            void connect()
          }, RECONNECT_MS * 2)
        }
      }
    }

    void connect()

    return () => {
      closed = true
      if (heartbeat) window.clearInterval(heartbeat)
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      if (docSavedTimerRef.current) {
        window.clearTimeout(docSavedTimerRef.current)
        docSavedTimerRef.current = undefined
      }
      if (yjsFallbackTimerRef.current) {
        window.clearTimeout(yjsFallbackTimerRef.current)
        yjsFallbackTimerRef.current = undefined
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "leave" }))
        socket.close()
      }
      wsRef.current = null
    }
  }, [enabled, documentId, kind, shareToken, handleMessage])

  const sendOp = useCallback(
    (path: string, value: unknown) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      markDocSaving()
      ws.send(JSON.stringify({ type: "doc.op", path, value }))
    },
    [markDocSaving]
  )

  /** Broadcast a Yjs update (base64). Prefer this over sendOp for live docs. */
  const sendYUpdate = useCallback(
    (updateB64: string) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      markDocSaving()
      ws.send(JSON.stringify({ type: "yjs.update", update: updateB64 }))
    },
    [markDocSaving]
  )

  const sendCursor = useCallback(
    (
      x: number,
      y: number,
      kind: CollabCursorKind = "pointer",
      h?: number,
      rects?: CollabNormRect[],
      meta?: SendCursorMeta
    ) => {
      const now = Date.now()
      // Carets/selections: slightly higher rate so typing + drag-select feel live
      const minGap =
        kind === "caret" || kind === "selection" ? 24 : CURSOR_THROTTLE_MS
      if (now - lastCursorSent.current < minGap) return
      lastCursorSent.current = now
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      ws.send(
        JSON.stringify({
          type: "presence.cursor",
          x,
          y,
          kind,
          ...(h != null && h > 0 ? { h } : {}),
          ...(rects && rects.length > 0 ? { rects } : {}),
          ...(meta?.path ? { path: meta.path } : {}),
          ...(meta?.sel ? { sel: meta.sel } : {}),
        })
      )
    },
    []
  )

  /** Hide remote pointer when mouse leaves the collab surface (paper + grid). */
  const clearCursor = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    lastCursorSent.current = 0
    ws.send(JSON.stringify({ type: "presence.cursor", clear: true }))
  }, [])

  return {
    status,
    /** "saving" while local ops in flight; "saved" after server echo settles. */
    docSaveStatus,
    peers,
    self,
    role,
    permissions,
    roomError,
    rev,
    remoteEpoch,
    sendOp,
    sendYUpdate,
    sendCursor,
    clearCursor,
    /** True once room snapshot received (safe to broadcast edits). */
    live: status === "synced",
    connected: status === "synced" || status === "connecting",
  }
}
