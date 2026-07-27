import { createContext, useContext } from "react"
import type { DocumentAssistantContextValue } from "./types"

export const DocumentAssistantContext =
  createContext<DocumentAssistantContextValue | null>(null)

export function useDocumentAssistant() {
  const ctx = useContext(DocumentAssistantContext)
  if (!ctx) {
    throw new Error(
      "useDocumentAssistant must be used within DocumentAssistantProvider"
    )
  }
  return ctx
}

/** Safe optional access when AI chrome may be outside the provider. */
export function useDocumentAssistantOptional() {
  return useContext(DocumentAssistantContext)
}
