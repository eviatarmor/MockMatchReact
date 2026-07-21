import { useState } from "react"
import type { DocumentStyle } from "@/components/document-editor"
import { parseDocumentStyle } from "@/lib/parse-document-style"
import { EDITOR_TEMPLATES } from "../constants"
import type { EditorTemplateId, ResumeDocument } from "../types"
import { useResumeDocument } from "./use-resume-document"
import { useResumeAutosave, type SaveStatus } from "./use-resume-autosave"

interface SessionSeed {
  readonly id: string
  readonly title: string
  readonly templateId: EditorTemplateId
  readonly style: DocumentStyle
  readonly document: ResumeDocument
}

export function useResumeEditorSession(seed: SessionSeed) {
  const { document, handlers } = useResumeDocument(seed.document)
  const [templateId, setTemplateId] = useState<EditorTemplateId>(seed.templateId)
  const [resumeName, setResumeName] = useState(seed.title)
  const [style, setStyle] = useState<DocumentStyle>(seed.style)

  const template = EDITOR_TEMPLATES.find((item) => item.id === templateId) ?? EDITOR_TEMPLATES[0]

  const selectTemplate = (id: EditorTemplateId) => {
    setTemplateId(id)
    const next = EDITOR_TEMPLATES.find((item) => item.id === id)
    if (next) setStyle(next.defaultStyle)
  }

  const updateStyle = (patch: Partial<DocumentStyle>) =>
    setStyle((prev) => ({ ...prev, ...patch }))

  const { status: saveStatus } = useResumeAutosave({
    resumeId: seed.id,
    title: resumeName,
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
    resumeName,
    setResumeName,
    style,
    updateStyle,
    saveStatus: saveStatus as SaveStatus,
  }
}

export function parseEditorTemplateId(value: string): EditorTemplateId {
  const match = EDITOR_TEMPLATES.find((t) => t.id === value)
  return match?.id ?? "modern"
}

export { parseDocumentStyle }

export function parseResumeDocument(value: unknown): ResumeDocument {
  return value as ResumeDocument
}
