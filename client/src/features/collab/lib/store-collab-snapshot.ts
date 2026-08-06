import type { MutableRefObject } from "react"
import type { CollabYSnapshot } from "@mockmatch/collab"

/** Room snapshot payload from collab join / server snapshot events. */
export type CollabRoomSnapshot = {
  readonly rev: number
  readonly title: string
  readonly templateId: string
  readonly style: Record<string, unknown>
  readonly document: unknown
}

/**
 * Cache the latest room snapshot for a one-shot Y.Doc safety seed when
 * `yjs.sync` never arrives (shared CRDT identity still comes from the room).
 */
export function storeCollabSnapshot(
  ref: MutableRefObject<CollabYSnapshot | null>,
  snap: Pick<
    CollabRoomSnapshot,
    "title" | "templateId" | "style" | "document"
  >
): void {
  ref.current = {
    title: snap.title,
    templateId: snap.templateId,
    style: snap.style,
    document: snap.document,
  }
}

type SeedableYDoc = {
  getMap: (name: string) => { readonly size: number }
}

/**
 * If the room is live and the root map is still empty, seed once from the
 * last cached room snapshot. No-op when already populated by `yjs.sync`.
 */
export function seedCollabFromLastSnapshot(
  live: boolean,
  ydoc: SeedableYDoc,
  lastSnap: CollabYSnapshot | null,
  seedFromSnapshot: (snap: CollabYSnapshot) => void
): void {
  if (!live || !lastSnap) return
  if (ydoc.getMap("root").size > 0) return
  seedFromSnapshot(lastSnap)
}
