import { createContext, useContext, type ReactNode } from "react"

export type DocumentAiAssistHandler = (selectedText: string) => void

const DocumentAiAssistContext = createContext<DocumentAiAssistHandler | null>(
  null
)

/** Provides selection → AI assist for all nested {@link RichTextField}s. */
export function DocumentAiAssistProvider({
  onAiAssist,
  children,
}: {
  readonly onAiAssist?: DocumentAiAssistHandler | null
  readonly children: ReactNode
}) {
  return (
    <DocumentAiAssistContext.Provider value={onAiAssist ?? null}>
      {children}
    </DocumentAiAssistContext.Provider>
  )
}

export function useDocumentAiAssist() {
  return useContext(DocumentAiAssistContext)
}
