import { useMemo, useRef, useState, type ReactNode } from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
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
      <SheetContent side="right" showCloseButton={false} className="w-full gap-0 p-0 sm:max-w-md">
        <SheetTitle className="sr-only">Details</SheetTitle>
        <ScrollArea className="h-full">{lastContent.current}</ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
