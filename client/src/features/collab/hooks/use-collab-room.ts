import { useCallback, useEffect, useRef, useState } from "react"
import type { DocumentKind } from "@mockmatch/schemas"
import { trpc } from "@/lib/trpc"
import { permissionsForRole } from "../lib/permissions"
import type {
  CollabCursorKind,
  CollabNormRect,
  CollabPeer,
  CollabSaveStatus,
  CollabServerMessage,
  CollabEffectiveRole,
  CollabPermissions,
} from "../types"

const HEARTBEAT_MS = 15_000
const CURSOR_THROTTLE_MS = 40
const RECONNECT_MS = 1_500

type SnapshotPayload = {
  rev: number
  title: string
  templateId: string
  style: Record<string, unknown>
  document: unknown
}

interface UseCollabRoomArgs {
  readonly kind: DocumentKind
  readonly documentId: string
  readonly enabled?: boolean
  readonly shareToken?: string | null
  readonly onRemoteOp?: (path: string, value: unknown, userId: string) => void
  readonly onSnapshot?: (snap: SnapshotPayload, role: CollabEffectiveRole) => void
}

export function useCollabRoom({
  kind,
  documentId,
  enabled = true,
  shareToken,
  onRemoteOp,
  onSnapshot,
}: UseCollabRoomArgs) {
  const [status, setStatus] = useState<CollabSaveStatus>("idle")
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
  onRemoteOpRef.current = onRemoteOp
  onSnapshotRef.current = onSnapshot

  const lastCursorSent = useRef(0)
  const ticketMut = trpc.collab.wsTicket.useMutation()
  const ticketMutRef = useRef(ticketMut)
  ticketMutRef.current = ticketMut

  const permissions: CollabPermissions = permissionsForRole(role)

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
      setStatus("synced")
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
      setStatus("error")
      setRoomError(msg.message)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !documentId) return

    let closed = false
    let heartbeat: number | undefined
    let reconnectTimer: number | undefined
    let socket: WebSocket | null = null

    const connect = async () => {
      if (closed) return
      setStatus("connecting")
      try {
        const ticket = await ticketMutRef.current.mutateAsync({
          kind,
          id: documentId,
          shareToken: shareToken || undefined,
        })
        if (closed) return

        const url = new URL(ticket.wsUrl)
        url.searchParams.set("ticket", ticket.ticket)
        socket = new WebSocket(url.toString())
        wsRef.current = socket

        socket.onopen = () => {
          if (closed) return
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
          if (closed) return
          setStatus("connecting")
          reconnectTimer = window.setTimeout(() => {
            void connect()
          }, RECONNECT_MS)
        }

        socket.onerror = () => {
          setStatus("error")
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to connect to collaboration"
        if (message.toLowerCase().includes("3 people") || message.includes("room")) {
          setStatus("room_full")
        } else {
          setStatus("error")
        }
        setRoomError(message)
        if (!closed) {
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
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "leave" }))
        socket.close()
      }
      wsRef.current = null
    }
  }, [enabled, documentId, kind, shareToken, handleMessage])

  const sendOp = useCallback((path: string, value: unknown) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    setStatus("synced")
    ws.send(JSON.stringify({ type: "doc.op", path, value }))
  }, [])

  const sendCursor = useCallback(
    (
      x: number,
      y: number,
      kind: CollabCursorKind = "pointer",
      h?: number,
      rects?: CollabNormRect[]
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
        })
      )
    },
    []
  )

  /** Hide remote pointer when mouse leaves the paper. */
  const clearCursor = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    lastCursorSent.current = 0
    ws.send(JSON.stringify({ type: "presence.cursor", clear: true }))
  }, [])

  return {
    status,
    peers,
    self,
    role,
    permissions,
    roomError,
    rev,
    remoteEpoch,
    sendOp,
    sendCursor,
    clearCursor,
    /** True once room snapshot received (safe to broadcast edits). */
    live: status === "synced",
    connected: status === "synced" || status === "connecting",
  }
}
