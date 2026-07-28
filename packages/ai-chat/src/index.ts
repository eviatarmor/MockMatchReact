/**
 * Product-agnostic AI chat shell for web apps and extensions.
 * Host supplies transport, labels, and optional tool UI.
 */
export {
  assistantTextClass,
  ASSISTANT_USER_TEXT_CLASS,
  type AssistantChrome,
} from "./assistant/text-class"
export { appendTranscript } from "./assistant/speech"
export {
  AssistantMessages,
  type AssistantMessagesProps,
} from "./assistant/assistant-messages"
export {
  AssistantSuggestions,
  type AssistantSuggestionsProps,
} from "./assistant/assistant-suggestions"
export {
  createWelcomeMessage,
  useAssistantChat,
  type UseAssistantChatOptions,
  type UseAssistantChatReturn,
} from "./assistant/use-assistant-chat"
export {
  useInputHistory,
  type InputHistorySnapshot,
  type UseInputHistoryReturn,
} from "./assistant/use-input-history"
