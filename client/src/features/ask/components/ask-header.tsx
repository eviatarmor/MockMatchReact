import { useTranslation } from "react-i18next"
import { SquarePen, X } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { useAskPanel } from "../ask-context"

type AskHeaderProps = {
  /** Override panel close (e.g. IDE AI slot). Defaults to AskProvider.closePanel. */
  readonly onClose?: () => void
  /** Override new-chat. Defaults to AskProvider.newChat. */
  readonly onNewChat?: () => void
}

export function AskHeader({ onClose, onNewChat }: AskHeaderProps = {}) {
  const { t } = useTranslation("ask")
  const { closePanel, newChat } = useAskPanel()

  const handleClose = onClose ?? closePanel
  const handleNewChat = onNewChat ?? newChat

  return (
    <div className="flex h-14 shrink-0 items-center gap-1 border-b border-sidebar-border px-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="cursor-pointer gap-1.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
              className="cursor-pointer text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
