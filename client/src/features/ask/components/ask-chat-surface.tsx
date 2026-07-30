import { useTranslation } from "react-i18next"
import type { AssistantChrome } from "@mockmatch/ai-chat"
import { cn } from "@/lib/utils"
import { useAskPanel } from "../ask-context"
import { useAskChat } from "../hooks/use-ask-chat"
import { AskHeader } from "./ask-header"
import { AskInput } from "./ask-input"
import { AskMessages } from "./ask-messages"
import { AskSuggestions } from "./ask-suggestions"

type AskChatSurfaceProps = {
  /** Close the host panel (dashboard rail or IDE AI slot). */
  readonly onClose?: () => void
  /** Suggestion marquee above the input. Default true (dashboard Ask). */
  readonly showSuggestions?: boolean
  /**
   * `sidebar` — always-dark dashboard chrome.
   * `surface` — app/IDE theme tokens (use inside IdeAiPanel).
   */
  readonly chrome?: AssistantChrome
  readonly className?: string
}

/**
 * Chat column only (header + messages + input). No outer width chrome —
 * host owns spring/resize (dashboard AskPanel or IdeAiPanel).
 */
export function AskChatSurface({
  onClose,
  showSuggestions: showSuggestionsProp = true,
  chrome = "sidebar",
  className,
}: AskChatSurfaceProps) {
  const { t } = useTranslation("ask")
  const { chatResetKey, closePanel, newChat } = useAskPanel()
  const {
    messages,
    status,
    error,
    input,
    setInput,
    isBusy,
    sendText,
    handleSubmit,
    showSuggestions: showSuggestionsFromChat,
    stop,
  } = useAskChat()

  const inputResetKey = `${chatResetKey}:${messages.length}`
  const showSuggestions = showSuggestionsProp && showSuggestionsFromChat
  const isSidebar = chrome === "sidebar"

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col",
        // Sidebar chrome is always near-black; scope `.dark` so Streamdown/Shiki
        // use dark tokens even when the app shell is light.
        isSidebar
          ? "bg-sidebar text-sidebar-foreground dark"
          : "bg-background text-foreground",
        className
      )}
      aria-label={t("title")}
      data-slot="ask-chat-surface"
      data-chrome={chrome}
    >
      <AskHeader
        chrome={chrome}
        onClose={onClose ?? closePanel}
        onNewChat={newChat}
      />
      <AskMessages
        messages={messages}
        status={status}
        error={error}
        chrome={chrome}
      />
      {showSuggestions ? (
        <AskSuggestions
          onSelect={sendText}
          disabled={isBusy}
          chrome={chrome}
        />
      ) : null}
      <AskInput
        chrome={chrome}
        value={input}
        onChange={setInput}
        onSubmit={() => void handleSubmit()}
        onStop={() => void stop()}
        isBusy={isBusy}
        resetKey={inputResetKey}
      />
    </div>
  )
}
