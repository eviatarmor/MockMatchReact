import { arrayMove } from "@dnd-kit/sortable"
import type { LucideIcon } from "lucide-react"

/**
 * Minimal contract every document "block" (a.k.a. section) must satisfy to be
 * managed by the generic block-list engine: a stable id and a discriminant
 * `type` string. Feature block unions (cover-letter blocks, resume sections)
 * extend this.
 */
export interface BlockBase {
  readonly id: string
  readonly type: string
}

/**
 * One entry in a feature's block-type registry. Drives the "Add section" menu,
 * the sections panel, and the between-block inserter — the same array is the
 * single source of truth for what sections exist and how to spawn an empty one.
 */
export interface BlockTypeMeta<T extends BlockBase> {
  readonly type: T["type"]
  readonly icon: LucideIcon
  readonly labelKey: string
  /** Factory for a fresh, empty block of this type. */
  readonly make: () => T
}

export type BlockListAction<T extends BlockBase> =
  | { kind: "updateBlock"; id: string; patch: Partial<T> }
  | { kind: "addBlock"; blockType: T["type"]; afterId?: string }
  | { kind: "duplicateBlock"; id: string }
  | { kind: "removeBlock"; id: string }
  | { kind: "moveBlock"; id: string; direction: "up" | "down" }
  | { kind: "reorderBlocks"; activeId: string; overId: string }

const indexOf = <T extends BlockBase>(blocks: readonly T[], id: string) =>
  blocks.findIndex((b) => b.id === id)

/**
 * Pure reducer over an ordered list of blocks. Every transition returns a fresh
 * readonly array, so it is trivially testable and free of feature coupling —
 * the only feature input is the `registry` (used to build new blocks on add).
 */
export function blockListReducer<T extends BlockBase>(
  registry: readonly BlockTypeMeta<T>[],
  state: readonly T[],
  action: BlockListAction<T>
): readonly T[] {
  switch (action.kind) {
    case "updateBlock":
      return state.map((b) => (b.id === action.id ? ({ ...b, ...action.patch } as T) : b))

    case "addBlock": {
      const meta = registry.find((m) => m.type === action.blockType)
      if (!meta) return state
      const block = meta.make()
      const at = action.afterId ? indexOf(state, action.afterId) + 1 : state.length
      const next = [...state]
      next.splice(at, 0, block)
      return next
    }

    case "duplicateBlock": {
      const at = indexOf(state, action.id)
      if (at === -1) return state
      const copy = { ...state[at], id: crypto.randomUUID() }
      const next = [...state]
      next.splice(at + 1, 0, copy)
      return next
    }

    case "removeBlock":
      return state.filter((b) => b.id !== action.id)

    case "moveBlock": {
      const at = indexOf(state, action.id)
      const to = action.direction === "up" ? at - 1 : at + 1
      if (at === -1 || to < 0 || to >= state.length) return state
      return arrayMove([...state], at, to)
    }

    case "reorderBlocks": {
      const from = indexOf(state, action.activeId)
      const to = indexOf(state, action.overId)
      if (from === -1 || to === -1 || from === to) return state
      return arrayMove([...state], from, to)
    }
  }
}
