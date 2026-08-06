import { useCallback, useEffect, useRef } from "react"
import {
  useCollabYDoc,
  type CollabYSnapshot,
} from "@mockmatch/collab"
import type { WhiteboardDocument } from "@mockmatch/whiteboard"
import { useCollabRoom } from "@/features/collab/hooks/use-collab-room"
import {
  seedCollabFromLastSnapshot,
  storeCollabSnapshot,
  type CollabRoomSnapshot,
} from "@/features/collab/lib/store-collab-snapshot"

function isWhiteboardDoc(v: unknown): v is WhiteboardDocument {
  return (
    Boolean(v) &&
    typeof v === "object" &&
    (v as WhiteboardDocument).version === 1 &&
    typeof (v as WhiteboardDocument).elements === "object"
  )
}

function applyRemoteWhiteboardDoc(
  live: boolean,
  snap: CollabYSnapshot,
  onRemoteDocument: (doc: WhiteboardDocument) => void,
  skipOutbound: { current: boolean }
): void {
  if (!live) return
  if (!isWhiteboardDoc(snap.document)) return
  skipOutbound.current = true
  onRemoteDocument(snap.document)
}

type Args = {
  readonly boardId: string | null
  readonly shareToken?: string | null
  readonly onRemoteDocument: (doc: WhiteboardDocument) => void
  readonly skipOutbound: { current: boolean }
}

/**
 * Room + Yjs wiring for a whiteboard board (snapshot cache, remote materialize).
 */
export function useWhiteboardCollabRoom({
  boardId,
  shareToken,
  onRemoteDocument,
  skipOutbound,
}: Args) {
  const sendYUpdateRef = useRef<(u: string) => void>(() => {})
  const liveRef = useRef(false)
  const lastSnapRef = useRef<CollabYSnapshot | null>(null)

  const onRemoteMaterialize = useCallback(
    (snap: CollabYSnapshot) => {
      applyRemoteWhiteboardDoc(
        liveRef.current,
        snap,
        onRemoteDocument,
        skipOutbound
      )
    },
    [onRemoteDocument, skipOutbound]
  )

  const yjs = useCollabYDoc({
    enabled: Boolean(boardId),
    sendUpdate: (u) => sendYUpdateRef.current(u),
    onRemoteMaterialize,
  })

  const applyRemoteUpdateRef = useRef(yjs.applyRemoteUpdate)
  applyRemoteUpdateRef.current = yjs.applyRemoteUpdate
  const seedFromSnapshotRef = useRef(yjs.seedFromSnapshot)
  seedFromSnapshotRef.current = yjs.seedFromSnapshot

  const onSnapshot = useCallback((snap: CollabRoomSnapshot) => {
    storeCollabSnapshot(lastSnapRef, snap)
  }, [])

  const collab = useCollabRoom({
    kind: "whiteboard",
    documentId: boardId ?? "",
    enabled: Boolean(boardId),
    shareToken,
    onSnapshot,
    onYjsSync: (u) => applyRemoteUpdateRef.current(u),
    onYjsUpdate: (u) => applyRemoteUpdateRef.current(u),
  })

  sendYUpdateRef.current = collab.sendYUpdate
  liveRef.current = collab.live

  useEffect(() => {
    seedCollabFromLastSnapshot(
      collab.live,
      yjs.ydoc,
      lastSnapRef.current,
      seedFromSnapshotRef.current
    )
  }, [collab.live, yjs.ydoc])

  return {
    collab,
    permissions: collab.permissions,
    ydoc: yjs.ydoc,
  }
}
