import { useMemo, useReducer } from "react"
import { useBlockList, type BlockListHandlers } from "@/components/document-editor"
import { LETTER_BLOCK_TYPES } from "../constants"
import type { CoverLetterDocument, LetterBlock } from "../types"

type SenderField = "name" | "title"
type RecipientField = "name" | "title" | "company"

/** Header (sender/date/recipient) portion of the document — the letter-specific part. */
type LetterHeader = Omit<CoverLetterDocument, "blocks">

type HeaderAction =
  | { kind: "setSenderField"; field: SenderField; value: string }
  | { kind: "setContact"; id: string; value: string }
  | { kind: "setDate"; value: string }
  | { kind: "setRecipientField"; field: RecipientField; value: string }

function headerReducer(state: LetterHeader, action: HeaderAction): LetterHeader {
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
  }
}

export type CoverLetterHandlers = BlockListHandlers<LetterBlock> & {
  readonly setSenderField: (field: SenderField, value: string) => void
  readonly setContact: (id: string, value: string) => void
  readonly setDate: (value: string) => void
  readonly setRecipientField: (field: RecipientField, value: string) => void
}

/**
 * Editable cover-letter controller. Composes the generic block-list engine
 * ({@link useBlockList}) for the body sections and owns the letter-specific
 * header fields (sender/date/recipient) in a small local reducer. The returned
 * `document` recombines the two halves so consumers see one document as before.
 */
export function useCoverLetterDocument(initial: CoverLetterDocument) {
  const [header, dispatch] = useReducer(headerReducer, {
    sender: initial.sender,
    date: initial.date,
    recipient: initial.recipient,
  })
  const { blocks, blockHandlers } = useBlockList(LETTER_BLOCK_TYPES, initial.blocks)

  const document: CoverLetterDocument = useMemo(() => ({ ...header, blocks }), [header, blocks])

  const handlers = useMemo<CoverLetterHandlers>(
    () => ({
      ...blockHandlers,
      setSenderField: (field, value) => dispatch({ kind: "setSenderField", field, value }),
      setContact: (id, value) => dispatch({ kind: "setContact", id, value }),
      setDate: (value) => dispatch({ kind: "setDate", value }),
      setRecipientField: (field, value) => dispatch({ kind: "setRecipientField", field, value }),
    }),
    [blockHandlers]
  )

  return { document, handlers }
}
