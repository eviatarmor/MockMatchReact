import { useTranslation } from "react-i18next"
import { AssistantSuggestions as SharedAssistantSuggestions } from "@/components/assistant"
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
    <SharedAssistantSuggestions
      ids={DOCUMENT_AI_SUGGESTION_IDS}
      labelForId={(id) => t(`ai.suggestions.${id}`)}
      onSelect={onSelect}
      disabled={disabled}
      chrome="surface"
    />
  )
}
