import { useState } from "react"
import type { DocumentStyle } from "@/components/document-editor"
import { EDITOR_TEMPLATES } from "../constants"
import type { CoverLetterDocument, EditorTemplateId } from "../types"
import { useCoverLetterDocument } from "./use-cover-letter-document"
import { useCoverLetterAutosave, type SaveStatus } from "./use-cover-letter-autosave"

interface SessionSeed {
  readonly id: string
  readonly title: string
  readonly templateId: EditorTemplateId
  readonly style: DocumentStyle
  readonly document: CoverLetterDocument
}

export function useCoverLetterEditorSession(seed: SessionSeed) {
  const { document, handlers } = useCoverLetterDocument(seed.document)
  const [templateId, setTemplateId] = useState<EditorTemplateId>(seed.templateId)
  const [letterName, setLetterName] = useState(seed.title)
  const [style, setStyle] = useState<DocumentStyle>(seed.style)

  const template = EDITOR_TEMPLATES.find((item) => item.id === templateId) ?? EDITOR_TEMPLATES[0]

  const selectTemplate = (id: EditorTemplateId) => {
    setTemplateId(id)
    const next = EDITOR_TEMPLATES.find((item) => item.id === id)
    if (next) setStyle(next.defaultStyle)
  }

  const updateStyle = (patch: Partial<DocumentStyle>) =>
    setStyle((prev) => ({ ...prev, ...patch }))

  const { status: saveStatus } = useCoverLetterAutosave({
    letterId: seed.id,
    title: letterName,
    templateId,
    style,
    document,
    enabled: true,
  })

  return {
    document,
    handlers,
    template,
    templateId,
    selectTemplate,
    letterName,
    setLetterName,
    style,
    updateStyle,
    saveStatus: saveStatus as SaveStatus,
  }
}

export function parseEditorTemplateId(value: string): EditorTemplateId {
  const match = EDITOR_TEMPLATES.find((t) => t.id === value)
  return match?.id ?? "modern"
}

export function parseCoverLetterDocument(value: unknown): CoverLetterDocument {
  return value as CoverLetterDocument
}
