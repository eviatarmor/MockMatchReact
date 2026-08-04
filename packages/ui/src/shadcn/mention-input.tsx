/**
 * @deprecated Prefer `@mockmatch/ui/mention` (`useMention`, `MentionPopup`, `MentionInput`).
 * Re-exports kept so existing imports keep working.
 */
export {
  MentionInput,
  MentionPopup,
  useMention,
  mentionDefaultGetQuery,
  mentionFilterSuggestions,
  mentionSuggestionKey,
  type MentionInputProps,
  type MentionSuggestion,
  type MentionQueryMatch,
  type MentionGetQuery,
  type UseMentionOptions,
  type UseMentionResult,
  type MentionPopupProps,
} from "./mention"
