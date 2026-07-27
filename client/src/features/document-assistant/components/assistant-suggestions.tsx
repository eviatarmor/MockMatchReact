import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Marquee,
  MarqueeContent,
  MarqueeEdge,
  MarqueeItem,
} from "@/components/ui/marquee"
import { DOCUMENT_AI_SUGGESTION_IDS } from "../constants"

type AssistantSuggestionsProps = {
  readonly i18nNs: string
  readonly onSelect: (text: string) => void
  readonly disabled?: boolean
}

export function AssistantSuggestions({
  i18nNs,
  onSelect,
  disabled,
}: AssistantSuggestionsProps) {
  const { t } = useTranslation(i18nNs)

  return (
    <div className="shrink-0 pb-2">
      <Marquee
        side="left"
        autoFill
        pauseOnHover
        speed={28}
        gap="0.5rem"
        className="w-full"
      >
        <MarqueeContent>
          {DOCUMENT_AI_SUGGESTION_IDS.map((id) => {
            const label = t(`ai.suggestions.${id}`)
            return (
              <MarqueeItem key={id}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onSelect(label)}
                  className="cursor-pointer rounded-full border-border bg-muted/40 px-3 text-foreground shadow-none hover:bg-muted"
                >
                  {label}
                </Button>
              </MarqueeItem>
            )
          })}
        </MarqueeContent>
        <MarqueeEdge side="left" size="sm" className="from-background" />
        <MarqueeEdge side="right" size="sm" className="from-background" />
      </Marquee>
    </div>
  )
}
