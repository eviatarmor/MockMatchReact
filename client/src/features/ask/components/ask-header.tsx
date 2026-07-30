import { useTranslation } from "react-i18next"
import { SquarePen, X } from "lucide-react"
import type { AssistantChrome } from "@mockmatch/ai-chat"
import { Button } from "@mockmatch/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@/lib/utils"
import { useAskPanel } from "../ask-context"

type AskHeaderProps = {
  readonly chrome?: AssistantChrome
  /** Override panel close (e.g. IDE AI slot). Defaults to AskProvider.closePanel. */
  readonly onClose?: () => void
  /** Override new-chat. Defaults to AskProvider.newChat. */
  readonly onNewChat?: () => void
}

export function AskHeader({
  chrome = "sidebar",
  onClose,
  onNewChat,
}: AskHeaderProps = {}) {
  const { t } = useTranslation("ask")
  const { closePanel, newChat } = useAskPanel()

  const handleClose = onClose ?? closePanel
  const handleNewChat = onNewChat ?? newChat
  const isSidebar = chrome === "sidebar"

  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center gap-1 border-b px-3",
        isSidebar ? "border-sidebar-border" : "border-border"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "cursor-pointer gap-1.5",
          isSidebar
            ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            : "text-foreground hover:bg-muted hover:text-foreground"
        )}
        onClick={handleNewChat}
      >
        <SquarePen className="size-3.5" />
        <span className="text-sm font-medium">{t("newChat")}</span>
      </Button>

      <div className="flex-1" />

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                "cursor-pointer",
                isSidebar
                  ? "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-label={t("close")}
              onClick={handleClose}
            />
          }
        >
          <X className="size-4" />
        </TooltipTrigger>
        <TooltipContent>{t("close")}</TooltipContent>
      </Tooltip>
    </div>
  )
}
