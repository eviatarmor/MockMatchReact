import { useTranslation } from "react-i18next"
import {
  AssistantSuggestions,
  type AssistantChrome,
} from "@mockmatch/ai-chat"
import { ASK_SUGGESTION_IDS } from "../constants"

type AskSuggestionsProps = {
  readonly onSelect: (text: string) => void
  readonly disabled?: boolean
  readonly chrome?: AssistantChrome
}

export function AskSuggestions({
  onSelect,
  disabled,
  chrome = "sidebar",
}: AskSuggestionsProps) {
  const { t } = useTranslation("ask")

  return (
    <AssistantSuggestions
      ids={ASK_SUGGESTION_IDS}
      labelForId={(id) => t(`suggestions.${id}`)}
      onSelect={onSelect}
      disabled={disabled}
      chrome={chrome}
    />
  )
}
