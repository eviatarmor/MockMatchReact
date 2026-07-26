import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Marquee,
  MarqueeContent,
  MarqueeEdge,
  MarqueeItem,
} from "@/components/ui/marquee"
import { ASK_SUGGESTION_IDS } from "../constants"

type AskSuggestionsProps = {
  readonly onSelect: (text: string) => void
  readonly disabled?: boolean
}

export function AskSuggestions({ onSelect, disabled }: AskSuggestionsProps) {
  const { t } = useTranslation("ask")

  return (
    <div className="shrink-0 pb-3">
      <Marquee
        side="left"
        autoFill
        pauseOnHover
        speed={28}
        gap="0.5rem"
        className="w-full"
      >
        <MarqueeContent>
          {ASK_SUGGESTION_IDS.map((id) => {
            const label = t(`suggestions.${id}`)
            return (
              <MarqueeItem key={id}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onSelect(label)}
                  className="cursor-pointer rounded-full border-sidebar-border bg-sidebar-accent/60 px-4 text-sidebar-foreground shadow-none hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
          className="from-sidebar"
        />
        <MarqueeEdge
          side="right"
          size="sm"
          className="from-sidebar"
        />
      </Marquee>
    </div>
  )
}
