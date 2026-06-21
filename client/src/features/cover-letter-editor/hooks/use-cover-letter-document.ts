import { useMemo, useReducer } from "react"
import { arrayMove } from "@dnd-kit/sortable"
import { LETTER_BLOCK_TYPES } from "../constants"
import type { CoverLetterDocument, LetterBlock, LetterBlockType } from "../types"

type SenderField = "name" | "title"
type RecipientField = "name" | "title" | "company"

type Action =
  | { kind: "setSenderField"; field: SenderField; value: string }
  | { kind: "setContact"; id: string; value: string }
  | { kind: "setDate"; value: string }
  | { kind: "setRecipientField"; field: RecipientField; value: string }
  | { kind: "updateBlock"; id: string; patch: Partial<LetterBlock> }
  | { kind: "addBlock"; blockType: LetterBlockType; afterId?: string }
  | { kind: "duplicateBlock"; id: string }
  | { kind: "removeBlock"; id: string }
  | { kind: "moveBlock"; id: string; direction: "up" | "down" }
  | { kind: "reorderBlocks"; activeId: string; overId: string }

const indexOf = (blocks: readonly LetterBlock[], id: string) => blocks.findIndex((b) => b.id === id)

function reducer(state: CoverLetterDocument, action: Action): CoverLetterDocument {
  switch (action.kind) {
    case "setSenderField":
      return { ...state, sender: { ...state.sender, [action.field]: action.value } }

    case "setContact":
      return {
        ...state,
        sender: {
          ...state.sender,
          contacts: state.sender.contacts.map((c) =>
            c.id === action.id ? { ...c, value: action.value } : c
          ),
        },
      }

    case "setDate":
      return { ...state, date: action.value }

    case "setRecipientField":
      return { ...state, recipient: { ...state.recipient, [action.field]: action.value } }

    case "updateBlock":
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.id ? ({ ...b, ...action.patch } as LetterBlock) : b
        ),
      }

    case "addBlock": {
      const meta = LETTER_BLOCK_TYPES.find((m) => m.type === action.blockType)
      if (!meta) return state
      const block = meta.make()
      const at = action.afterId ? indexOf(state.blocks, action.afterId) + 1 : state.blocks.length
      const blocks = [...state.blocks]
      blocks.splice(at, 0, block)
      return { ...state, blocks }
    }

    case "duplicateBlock": {
      const at = indexOf(state.blocks, action.id)
      if (at === -1) return state
      const copy = { ...state.blocks[at], id: crypto.randomUUID() }
      const blocks = [...state.blocks]
      blocks.splice(at + 1, 0, copy)
      return { ...state, blocks }
    }

    case "removeBlock":
      return { ...state, blocks: state.blocks.filter((b) => b.id !== action.id) }

    case "moveBlock": {
      const at = indexOf(state.blocks, action.id)
      const to = action.direction === "up" ? at - 1 : at + 1
      if (at === -1 || to < 0 || to >= state.blocks.length) return state
      return { ...state, blocks: arrayMove([...state.blocks], at, to) }
    }

    case "reorderBlocks": {
      const from = indexOf(state.blocks, action.activeId)
      const to = indexOf(state.blocks, action.overId)
      if (from === -1 || to === -1 || from === to) return state
      return { ...state, blocks: arrayMove([...state.blocks], from, to) }
    }
  }
}

export type CoverLetterHandlers = {
  readonly setSenderField: (field: SenderField, value: string) => void
  readonly setContact: (id: string, value: string) => void
  readonly setDate: (value: string) => void
  readonly setRecipientField: (field: RecipientField, value: string) => void
  readonly updateBlock: (id: string, patch: Partial<LetterBlock>) => void
  readonly addBlock: (blockType: LetterBlockType, afterId?: string) => void
  readonly duplicateBlock: (id: string) => void
  readonly removeBlock: (id: string) => void
  readonly moveBlock: (id: string, direction: "up" | "down") => void
  readonly reorderBlocks: (activeId: string, overId: string) => void
}

/**
 * Editable document controller. Owns the block-based {@link CoverLetterDocument}
 * and exposes granular handlers for inline field edits + block CRUD/reorder.
 * Kept reducer-based so every mutation is a pure, testable transition.
 */
export function useCoverLetterDocument(initial: CoverLetterDocument) {
  const [document, dispatch] = useReducer(reducer, initial)

  const handlers = useMemo<CoverLetterHandlers>(
    () => ({
      setSenderField: (field, value) => dispatch({ kind: "setSenderField", field, value }),
      setContact: (id, value) => dispatch({ kind: "setContact", id, value }),
      setDate: (value) => dispatch({ kind: "setDate", value }),
      setRecipientField: (field, value) => dispatch({ kind: "setRecipientField", field, value }),
      updateBlock: (id, patch) => dispatch({ kind: "updateBlock", id, patch }),
      addBlock: (blockType, afterId) => dispatch({ kind: "addBlock", blockType, afterId }),
      duplicateBlock: (id) => dispatch({ kind: "duplicateBlock", id }),
      removeBlock: (id) => dispatch({ kind: "removeBlock", id }),
      moveBlock: (id, direction) => dispatch({ kind: "moveBlock", id, direction }),
      reorderBlocks: (activeId, overId) => dispatch({ kind: "reorderBlocks", activeId, overId }),
    }),
    []
  )

  return { document, handlers }
}
