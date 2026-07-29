import type { Provider, ProviderAwareness, UserState } from "@lexical/yjs"
import type { Doc } from "yjs"

type SyncCb = (isSynced: boolean) => void
type StatusCb = (arg: { status: string }) => void
type UpdateCb = (arg: unknown) => void
type ReloadCb = (doc: Doc) => void
type AwarenessUpdateCb = () => void

/**
 * Minimal Provider for @lexical/yjs when the host already syncs the Y.Doc
 * (our collab WS). Awareness is local-only — paper cursors handle peers.
 */
export function createLocalLexicalProvider(): Provider {
  const syncListeners = new Set<SyncCb>()
  const statusListeners = new Set<StatusCb>()
  const updateListeners = new Set<UpdateCb>()
  const reloadListeners = new Set<ReloadCb>()
  const awarenessUpdateListeners = new Set<AwarenessUpdateCb>()

  let localState: UserState | null = null
  const states = new Map<number, UserState>()

  const awareness: ProviderAwareness = {
    getLocalState: () => localState,
    getStates: () => states,
    setLocalState: (next) => {
      localState = next
      if (next) states.set(0, next)
      else states.delete(0)
      awarenessUpdateListeners.forEach((cb) => cb())
    },
    setLocalStateField: (field, value) => {
      const base: UserState = localState ?? {
        anchorPos: null,
        color: "#3B82F6",
        focusing: false,
        focusPos: null,
        name: "Editor",
        awarenessData: {},
      }
      localState = { ...base, [field]: value }
      states.set(0, localState)
      awarenessUpdateListeners.forEach((cb) => cb())
    },
    on: (type, cb) => {
      if (type === "update") awarenessUpdateListeners.add(cb as AwarenessUpdateCb)
    },
    off: (type, cb) => {
      if (type === "update") {
        awarenessUpdateListeners.delete(cb as AwarenessUpdateCb)
      }
    },
  }

  const provider: Provider = {
    awareness,
    connect: () => {
      statusListeners.forEach((cb) => cb({ status: "connected" }))
      syncListeners.forEach((cb) => cb(true))
    },
    disconnect: () => {
      statusListeners.forEach((cb) => cb({ status: "disconnected" }))
    },
    on: (type, cb) => {
      if (type === "sync") syncListeners.add(cb as SyncCb)
      else if (type === "status") statusListeners.add(cb as StatusCb)
      else if (type === "update") updateListeners.add(cb as UpdateCb)
      else if (type === "reload") reloadListeners.add(cb as ReloadCb)
    },
    off: (type, cb) => {
      if (type === "sync") syncListeners.delete(cb as SyncCb)
      else if (type === "status") statusListeners.delete(cb as StatusCb)
      else if (type === "update") updateListeners.delete(cb as UpdateCb)
      else if (type === "reload") reloadListeners.delete(cb as ReloadCb)
    },
  }

  return provider
}
