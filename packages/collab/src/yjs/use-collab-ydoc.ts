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
 * Owns a Y.Doc for collab: seeds from JSON snapshot, applies remote updates,
 * emits local updates. Host keeps optimistic React state on local edits.
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

  useEffect(() => {
    let raf = 0
    const onUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === Y_ORIGIN_REMOTE) {
        if (raf) cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          raf = 0
          onRemoteMaterializeRef.current(materializeCollabYDoc(ydoc))
        })
        return
      }
      if (!enabledRef.current) return
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
    seedFromSnapshot: (snap: CollabYSnapshot) => {
      seedCollabYDoc(ydoc, snap, Y_ORIGIN_REMOTE)
    },
    applyRemoteUpdate: (updateB64: string) => {
      try {
        applyRemoteYUpdate(ydoc, decodeB64(updateB64))
      } catch {
        // ignore corrupt updates
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
