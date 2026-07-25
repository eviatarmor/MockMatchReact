import { useCallback, useEffect, useRef, useState } from "react"
import { setByPath } from "../lib/apply-path-op"

type SendOp = (path: string, value: unknown) => void

interface UseCollabDocumentSyncArgs<T> {
  readonly document: T
  readonly replaceDocument: (next: T) => void
  readonly sendOp: SendOp
  readonly canEdit: boolean
  readonly connected: boolean
  readonly parseDocument: (value: unknown) => T
  /**
   * remoteEpoch from useCollabRoom — increments only when a peer applies a doc.op.
   * Used to remount fields so observers always see live text.
   */
  readonly remoteEpoch: number
}

/**
 * Live collab document sync:
 * - Broadcast full `document` on local change (trailing 32ms — feels realtime)
 * - Apply remote path ops with fixed array path handling
 * - Expose `viewKey` to remount the paper when peers edit (guarantees UI refresh)
 */
export function useCollabDocumentSync<T extends object>({
  document,
  replaceDocument,
  sendOp,
  canEdit,
  connected,
  parseDocument,
  remoteEpoch,
}: UseCollabDocumentSyncArgs<T>) {
  const skipBroadcast = useRef(false)
  const pending = useRef(document)
  pending.current = document
  const [viewKey, setViewKey] = useState(0)

  // Remount paper when peer edits so controlled + Lexical fields pick up text
  useEffect(() => {
    if (remoteEpoch > 0) setViewKey(remoteEpoch)
  }, [remoteEpoch])

  const applyRemoteOp = useCallback(
    (path: string, value: unknown) => {
      skipBroadcast.current = true
      if (path === "document") {
        replaceDocument(parseDocument(value))
        return
      }
      if (path.startsWith("document.")) {
        const root = setByPath(
          { document: pending.current } as Record<string, unknown>,
          path,
          value
        )
        replaceDocument(parseDocument(root.document))
        return
      }
      // title / style / template handled by session
    },
    [parseDocument, replaceDocument]
  )

  const applySnapshotDocument = useCallback(
    (value: unknown) => {
      skipBroadcast.current = true
      replaceDocument(parseDocument(value))
    },
    [parseDocument, replaceDocument]
  )

  // Local → peers: flush soon after each keystroke
  useEffect(() => {
    if (skipBroadcast.current) {
      skipBroadcast.current = false
      return
    }
    if (!canEdit || !connected) return

    const timer = window.setTimeout(() => {
      sendOp("document", pending.current)
    }, 32)

    return () => window.clearTimeout(timer)
  }, [document, canEdit, connected, sendOp])

  /** Immediate path send (optional fine-grained). Always also queues full doc via effect. */
  const sendPath = useCallback(
    (path: string, value: unknown) => {
      if (!canEdit || !connected) return
      sendOp(path, value)
    },
    [canEdit, connected, sendOp]
  )

  return {
    viewKey,
    applyRemoteOp,
    applySnapshotDocument,
    sendPath,
    markSkipBroadcast: () => {
      skipBroadcast.current = true
    },
  }
}
