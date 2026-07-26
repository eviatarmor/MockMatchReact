import { createContext, useContext, type ReactNode } from "react"

/**
 * When true, read-only {@link EditableText} renders values as HTML so version
 * history can inject green/red word-diff spans.
 */
const DiffHtmlContext = createContext(false)

export function DiffHtmlProvider({
  enabled,
  children,
}: {
  readonly enabled: boolean
  readonly children: ReactNode
}) {
  return (
    <DiffHtmlContext.Provider value={enabled}>{children}</DiffHtmlContext.Provider>
  )
}

export function useDiffHtml(): boolean {
  return useContext(DiffHtmlContext)
}
