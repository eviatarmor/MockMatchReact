import { useMemo, useReducer } from "react"
import { useBlockList, type BlockListHandlers } from "@/components/document-editor"
import { RESUME_SECTION_TYPES } from "../constants"
import type { ResumeDocument, ResumeHeader, ResumeSection } from "../types"

type HeaderField = "name" | "headline"

type HeaderAction =
  | { kind: "setHeaderField"; field: HeaderField; value: string }
  | { kind: "setContact"; id: string; value: string }

function headerReducer(state: ResumeHeader, action: HeaderAction): ResumeHeader {
  switch (action.kind) {
    case "setHeaderField":
      return { ...state, [action.field]: action.value }

    case "setContact":
      return {
        ...state,
        contacts: (state.contacts ?? []).map((c) =>
          c.id === action.id ? { ...c, value: action.value } : c
        ),
      }
  }
}

export type ResumeHandlers = BlockListHandlers<ResumeSection> & {
  readonly setHeaderField: (field: HeaderField, value: string) => void
  readonly setContact: (id: string, value: string) => void
}

/**
 * Editable resume controller. Composes the generic block-list engine
 * ({@link useBlockList}) for the body sections and owns the resume-specific
 * header (name/headline/contacts) in a small local reducer. Nested list
 * mutations inside a section (bullets, skill groups, language rows) are applied
 * through `updateBlock` by the field editors, so the engine stays section-shape
 * agnostic. The returned `document` recombines the two halves.
 */
export function useResumeDocument(initial: ResumeDocument) {
  const [header, dispatch] = useReducer(headerReducer, initial.header)
  const { blocks: sections, blockHandlers } = useBlockList(RESUME_SECTION_TYPES, initial.sections)

  const document: ResumeDocument = useMemo(() => ({ header, sections }), [header, sections])

  const handlers = useMemo<ResumeHandlers>(
    () => ({
      ...blockHandlers,
      setHeaderField: (field, value) => dispatch({ kind: "setHeaderField", field, value }),
      setContact: (id, value) => dispatch({ kind: "setContact", id, value }),
    }),
    [blockHandlers]
  )

  return { document, handlers }
}
