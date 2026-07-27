import { Button } from "@/components/ui/button"
import {
  Marquee,
  MarqueeContent,
  MarqueeEdge,
  MarqueeItem,
} from "@/components/ui/marquee"
import { cn } from "@/lib/utils"
import type { AssistantChrome } from "./text-class"

export type AssistantSuggestionsProps = {
  readonly ids: readonly string[]
  readonly labelForId: (id: string) => string
  readonly onSelect: (text: string) => void
  readonly disabled?: boolean
  readonly chrome?: AssistantChrome
  readonly className?: string
}

export function AssistantSuggestions({
  ids,
  labelForId,
  onSelect,
  disabled,
  chrome = "surface",
  className,
}: AssistantSuggestionsProps) {
  const isSidebar = chrome === "sidebar"

  return (
    <div className={cn("shrink-0", isSidebar ? "pb-3" : "pb-2", className)}>
      <Marquee
        side="left"
        autoFill
        pauseOnHover
        speed={28}
        gap="0.5rem"
        className="w-full"
      >
        <MarqueeContent>
          {ids.map((id) => {
            const label = labelForId(id)
            return (
              <MarqueeItem key={id}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onSelect(label)}
                  className={cn(
                    "cursor-pointer rounded-full shadow-none",
                    isSidebar
                      ? "border-sidebar-border bg-sidebar-accent/60 px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      : "border-border bg-muted/40 px-3 text-foreground hover:bg-muted"
                  )}
                >
                  {label}
                </Button>
              </MarqueeItem>
            )
          })}
        </MarqueeContent>
        <MarqueeEdge
          side="left"
          size="sm"
          className={isSidebar ? "from-sidebar" : "from-background"}
        />
        <MarqueeEdge
          side="right"
          size="sm"
          className={isSidebar ? "from-sidebar" : "from-background"}
        />
      </Marquee>
    </div>
  )
}
