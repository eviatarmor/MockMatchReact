import { useCallback, useMemo, useReducer } from "react"
import { useBlockList, type BlockListHandlers } from "@/components/document-editor"
import { RESUME_SECTION_TYPES } from "../constants"
import type { ResumeDocument, ResumeHeader, ResumeSection } from "../types"

type HeaderField = "name" | "headline"

type HeaderAction =
  | { kind: "setHeaderField"; field: HeaderField; value: string }
  | { kind: "setContact"; id: string; value: string }
  | { kind: "replaceHeader"; header: ResumeHeader }

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

    case "replaceHeader":
      return action.header
  }
}

export type ResumeHandlers = BlockListHandlers<ResumeSection> & {
  readonly setHeaderField: (field: HeaderField, value: string) => void
  readonly setContact: (id: string, value: string) => void
}

/**
 * Editable resume controller. Composes the generic block-list engine
 * ({@link useBlockList}) for the body sections and owns the resume-specific
 * header (name/headline/contacts) in a small local reducer.
 */
export function useResumeDocument(initial: ResumeDocument) {
  const [header, dispatch] = useReducer(headerReducer, initial.header)
  const { blocks: sections, blockHandlers, replaceBlocks } = useBlockList(
    RESUME_SECTION_TYPES,
    initial.sections
  )

  const document: ResumeDocument = useMemo(() => ({ header, sections }), [header, sections])

  const replaceDocument = useCallback(
    (next: ResumeDocument) => {
      dispatch({ kind: "replaceHeader", header: next.header })
      replaceBlocks(next.sections)
    },
    [replaceBlocks]
  )

  const handlers = useMemo<ResumeHandlers>(
    () => ({
      ...blockHandlers,
      setHeaderField: (field, value) => dispatch({ kind: "setHeaderField", field, value }),
      setContact: (id, value) => dispatch({ kind: "setContact", id, value }),
    }),
    [blockHandlers]
  )

  return { document, handlers, replaceDocument }
}
