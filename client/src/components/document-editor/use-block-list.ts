import { useMemo, useReducer } from "react"
import { blockListReducer, type BlockBase, type BlockListAction, type BlockTypeMeta } from "./block-list"

/**
 * The granular block-mutation handlers, shared by every editor. A feature's
 * document hook spreads these into its own handler object alongside any
 * header-specific setters (e.g. the cover letter's sender/recipient fields).
 */
export interface BlockListHandlers<T extends BlockBase> {
  readonly updateBlock: (id: string, patch: Partial<T>) => void
  readonly addBlock: (blockType: T["type"], afterId?: string) => void
  readonly duplicateBlock: (id: string) => void
  readonly removeBlock: (id: string) => void
  readonly moveBlock: (id: string, direction: "up" | "down") => void
  readonly reorderBlocks: (activeId: string, overId: string) => void
}

/**
 * Generic editable block-list controller. Owns the ordered `blocks` state via
 * the pure {@link blockListReducer} and exposes memoized CRUD/reorder handlers.
 * Both the cover-letter and resume editors compose this so the list mechanics
 * live in exactly one place.
 */
export function useBlockList<T extends BlockBase>(
  registry: readonly BlockTypeMeta<T>[],
  initial: readonly T[]
) {
  const [blocks, dispatch] = useReducer(
    (state: readonly T[], action: BlockListAction<T>) => blockListReducer(registry, state, action),
    initial
  )

  const blockHandlers = useMemo<BlockListHandlers<T>>(
    () => ({
      updateBlock: (id, patch) => dispatch({ kind: "updateBlock", id, patch }),
      addBlock: (blockType, afterId) => dispatch({ kind: "addBlock", blockType, afterId }),
      duplicateBlock: (id) => dispatch({ kind: "duplicateBlock", id }),
      removeBlock: (id) => dispatch({ kind: "removeBlock", id }),
      moveBlock: (id, direction) => dispatch({ kind: "moveBlock", id, direction }),
      reorderBlocks: (activeId, overId) => dispatch({ kind: "reorderBlocks", activeId, overId }),
    }),
    []
  )

  return { blocks, blockHandlers }
}
