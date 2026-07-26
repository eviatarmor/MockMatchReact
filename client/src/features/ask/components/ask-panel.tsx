import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useAskPanel } from "../ask-context"
import { useAskChat } from "../hooks/use-ask-chat"
import { AskHeader } from "./ask-header"
import { AskInput } from "./ask-input"
import { AskMessages } from "./ask-messages"
import { AskSuggestions } from "./ask-suggestions"

/**
 * Right chrome column on the dark dashboard shell (mirrors left SectionNav).
 */
export function AskPanel() {
  const { t } = useTranslation("ask")
  const { open, chatResetKey } = useAskPanel()
  const {
    messages,
    status,
    error,
    input,
    setInput,
    isBusy,
    sendText,
    handleSubmit,
    showSuggestions,
    stop,
  } = useAskChat()

  // Reset speech UI when user sends (input clears) or new chat.
  const inputResetKey = `${chatResetKey}:${messages.length}`

  return (
    <aside
      aria-label={t("title")}
      aria-hidden={!open}
      className={cn(
        "h-full min-h-0 shrink-0 overflow-hidden bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear",
        open ? "w-96" : "w-0"
      )}
    >
      <div className="flex h-full min-h-0 w-96 flex-col">
        <AskHeader />
        <AskMessages messages={messages} status={status} error={error} />
        {showSuggestions && (
          <AskSuggestions onSelect={sendText} disabled={isBusy} />
        )}
        <AskInput
          value={input}
          onChange={setInput}
          onSubmit={() => void handleSubmit()}
          onStop={() => void stop()}
          isBusy={isBusy}
          resetKey={inputResetKey}
        />
      </div>
    </aside>
  )
}
