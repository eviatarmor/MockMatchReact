import { createContext, useContext } from "react"

export type AskPanelContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  openPanel: () => void
  closePanel: () => void
  /** Open if closed; close if open. */
  togglePanel: () => void
  /** Bumped on New chat so chat hook can reset messages. */
  chatResetKey: number
  newChat: () => void
}

export const AskPanelContext = createContext<AskPanelContextValue | null>(null)

export function useAskPanel() {
  const ctx = useContext(AskPanelContext)
  if (!ctx) {
    throw new Error("useAskPanel must be used within AskProvider")
  }
  return ctx
}
