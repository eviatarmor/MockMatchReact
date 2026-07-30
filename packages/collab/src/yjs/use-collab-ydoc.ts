import { useEffect, useRef } from "react"
import * as Y from "yjs"
import {
  applyRemoteYUpdate,
  createCollabYDoc,
  materializeCollabYDoc,
  seedCollabYDoc,
  type CollabYSnapshot,
  Y_ORIGIN_REMOTE,
  encodeYUpdate,
  encodeFullYState,
} from "./collab-ydoc"

type UseCollabYDocArgs = {
  /** When true, observe local updates and call sendUpdate. */
  readonly enabled: boolean
  readonly sendUpdate: (updateB64: string) => void
  /** Called only for remote merges (and when applying remote sync). */
  readonly onRemoteMaterialize: (snap: CollabYSnapshot) => void
}

/**
 * Owns a Y.Doc for collab: applies server yjs.sync / peer updates, emits local
 * updates. Host keeps optimistic React state on local edits.
 *
 * Do **not** seed the client Y.Doc from JSON when a server `yjs.sync` is coming —
 * that creates a second CRDT identity and peer updates never land on the same
 * shared types. Prefer empty doc → applyRemoteUpdate(full state).
 */
export function useCollabYDoc({
  enabled,
  sendUpdate,
  onRemoteMaterialize,
}: UseCollabYDocArgs) {
  const ydocRef = useRef<Y.Doc | null>(null)
  if (!ydocRef.current) {
    ydocRef.current = createCollabYDoc()
  }
  const ydoc = ydocRef.current

  const sendUpdateRef = useRef(sendUpdate)
  sendUpdateRef.current = sendUpdate
  const onRemoteMaterializeRef = useRef(onRemoteMaterialize)
  onRemoteMaterializeRef.current = onRemoteMaterialize
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  /** After first successful remote apply (yjs.sync or peer update). */
  const hasRemoteStateRef = useRef(false)

  useEffect(() => {
    let raf = 0
    const onUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === Y_ORIGIN_REMOTE) {
        hasRemoteStateRef.current = true
        if (raf) cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          raf = 0
          onRemoteMaterializeRef.current(materializeCollabYDoc(ydoc))
        })
        return
      }
      // Drop local broadcasts until server CRDT state is applied — otherwise we
      // mint orphan Y types that peers (on the server tree) never share.
      if (!enabledRef.current || !hasRemoteStateRef.current) return
      sendUpdateRef.current(encodeYUpdate(update))
    }
    ydoc.on("update", onUpdate)
    return () => {
      ydoc.off("update", onUpdate)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ydoc])

  return {
    ydoc,
    /**
     * Emergency-only: seed when yjs.sync will not arrive. Prefer applyRemoteUpdate.
     * Still marks remote-ready so later local edits can broadcast.
     */
    seedFromSnapshot: (snap: CollabYSnapshot) => {
      seedCollabYDoc(ydoc, snap, Y_ORIGIN_REMOTE)
      hasRemoteStateRef.current = true
    },
    applyRemoteUpdate: (updateB64: string) => {
      try {
        applyRemoteYUpdate(ydoc, decodeB64(updateB64))
        hasRemoteStateRef.current = true
        // Immediate materialize (don't wait only for observer + rAF)
        onRemoteMaterializeRef.current(materializeCollabYDoc(ydoc))
      } catch (err) {
        // Corrupt / empty update — leave hasRemoteState false so safety seed can run
        console.warn("[collab] failed to apply remote Yjs update", err)
      }
    },
    getFullStateB64: () => encodeYUpdate(encodeFullYState(ydoc)),
    materialize: () => materializeCollabYDoc(ydoc),
  }
}

function decodeB64(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i)
  }
  return out
}
