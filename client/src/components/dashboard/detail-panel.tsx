import { useMemo, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useMediaQuery } from "@/hooks/use-media-query"
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

export function DetailPanel() {
  const content = useDetailPanelContent()
  const { close } = useDetailPanel()
  // below lg (1024px) → overlay sheet; lg+ → inline push-panel
  const isCompact = useMediaQuery("(max-width: 1023px)")
  const isOpen = content !== null
  // Keep the last content mounted through the close/slide animation.
  const lastContent = useRef<ReactNode>(null)
  if (isOpen) {
    lastContent.current = content
  }

  // below lg : overlay sheet
  if (isCompact) {
    return (
      <Sheet open={isOpen} onOpenChange={(next) => !next && close()}>
        <SheetContent side="right" showCloseButton={false} className="w-full gap-0 p-0 sm:max-w-md">
          <SheetTitle className="sr-only">Details</SheetTitle>
          <div className="h-full overflow-y-auto">{lastContent.current}</div>
        </SheetContent>
      </Sheet>
    )
  }

  // lg+ : inline push-panel that narrows the content area
  return (
    <div
      data-state={isOpen ? "open" : "closed"}
      className={cn(
        "sticky top-0 h-svh shrink-0 self-start overflow-hidden transition-[width,padding,opacity] duration-200 ease-in-out",
        "w-0 opacity-0",
        "data-[state=open]:w-[27rem] data-[state=open]:py-4 data-[state=open]:pr-4 data-[state=open]:opacity-100"
      )}
    >
      <div className="h-full w-full overflow-y-auto rounded-xl border bg-sidebar shadow-sm">
        {lastContent.current}
      </div>
    </div>
  )
}
