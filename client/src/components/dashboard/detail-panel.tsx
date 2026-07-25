import { useMemo, useRef, useState, type ReactNode } from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  DetailPanelActionsContext,
  DetailPanelContentContext,
  useDetailPanel,
  useDetailPanelContent,
} from "@/hooks/use-detail-panel"

export function DetailPanelProvider({ children }: { readonly children: ReactNode }) {
  const [content, setContent] = useState<ReactNode | null>(null)

  const actions = useMemo(
    () => ({
      open: (next: ReactNode) => setContent(next),
      close: () => setContent(null),
    }),
    []
  )

  return (
    <DetailPanelActionsContext.Provider value={actions}>
      <DetailPanelContentContext.Provider value={content}>
        {children}
      </DetailPanelContentContext.Provider>
    </DetailPanelActionsContext.Provider>
  )
}

/** Right-side overlay sheet for entity details (job cards, etc.). */
export function DetailPanel() {
  const content = useDetailPanelContent()
  const { close } = useDetailPanel()
  const isOpen = content !== null
  // Keep the last content mounted through the close/slide animation.
  const lastContent = useRef<ReactNode>(null)
  if (isOpen) {
    lastContent.current = content
  }

  return (
    <Sheet open={isOpen} onOpenChange={(next) => !next && close()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg data-[side=right]:sm:max-w-lg"
      >
        <SheetTitle className="sr-only">Details</SheetTitle>
        <div className="min-h-0 flex-1">{lastContent.current}</div>
      </SheetContent>
    </Sheet>
  )
}
