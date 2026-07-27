import { useTranslation } from "react-i18next"
import { AssistantSuggestions } from "@/components/assistant"
import { ASK_SUGGESTION_IDS } from "../constants"

type AskSuggestionsProps = {
  readonly onSelect: (text: string) => void
  readonly disabled?: boolean
}

export function AskSuggestions({ onSelect, disabled }: AskSuggestionsProps) {
  const { t } = useTranslation("ask")

  return (
    <AssistantSuggestions
      ids={ASK_SUGGESTION_IDS}
      labelForId={(id) => t(`suggestions.${id}`)}
      onSelect={onSelect}
      disabled={disabled}
      chrome="sidebar"
    />
  )
}
