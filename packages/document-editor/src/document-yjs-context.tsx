import { createContext, useContext, type ReactNode } from "react"
import type * as Y from "yjs"

export type DocumentYjsContextValue = {
  /** Shared room Y.Doc (same instance as collab). */
  readonly ydoc: Y.Doc | null
  /** When false, RichTextField uses controlled HTML only. */
  readonly enabled: boolean
  /** Display name for Lexical awareness (optional). */
  readonly userName?: string
  /** Hex color for Lexical awareness (optional). */
  readonly userColor?: string
}

const DocumentYjsContext = createContext<DocumentYjsContextValue>({
  ydoc: null,
  enabled: false,
})

/** Host wraps the editor tree when collab is live. */
export function DocumentYjsProvider({
  ydoc,
  enabled,
  userName,
  userColor,
  children,
}: DocumentYjsContextValue & { readonly children: ReactNode }) {
  return (
    <DocumentYjsContext.Provider
      value={{ ydoc, enabled: enabled && ydoc != null, userName, userColor }}
    >
      {children}
    </DocumentYjsContext.Provider>
  )
}

export function useDocumentYjs(): DocumentYjsContextValue {
  return useContext(DocumentYjsContext)
}
