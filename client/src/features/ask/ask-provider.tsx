import { useCallback, useMemo, useState, type ReactNode } from "react"
import { AskPanelContext } from "./ask-context"

export function AskProvider({ children }: { readonly children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [chatResetKey, setChatResetKey] = useState(0)

  const openPanel = useCallback(() => setOpen(true), [])
  const closePanel = useCallback(() => setOpen(false), [])
  const togglePanel = useCallback(() => setOpen((wasOpen) => !wasOpen), [])
  const newChat = useCallback(() => {
    setChatResetKey((k) => k + 1)
    setOpen(true)
  }, [])

  const value = useMemo(
    () => ({
      open,
      setOpen,
      openPanel,
      closePanel,
      togglePanel,
      chatResetKey,
      newChat,
    }),
    [open, openPanel, closePanel, togglePanel, chatResetKey, newChat]
  )

  return (
    <AskPanelContext.Provider value={value}>{children}</AskPanelContext.Provider>
  )
}
