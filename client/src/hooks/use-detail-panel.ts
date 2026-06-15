import { createContext, useContext, type ReactNode } from "react"

export interface DetailPanelActions {
  readonly open: (content: ReactNode) => void
  readonly close: () => void
}

export const DetailPanelContentContext = createContext<ReactNode | null>(null)
export const DetailPanelActionsContext = createContext<DetailPanelActions | null>(null)

export function useDetailPanelContent() {
  return useContext(DetailPanelContentContext)
}

export function useDetailPanel() {
  const context = useContext(DetailPanelActionsContext)
  if (!context) {
    throw new Error("useDetailPanel must be used within a DetailPanelProvider")
  }
  return context
}
