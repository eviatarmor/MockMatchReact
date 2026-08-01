import { useState } from "react"
import { Bell } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@mockmatch/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@mockmatch/ui/popover"
import { cn } from "@/lib/utils"
import { NotificationPanel } from "./notification-panel"
import { useNotifications } from "./use-notifications"

export function NotificationBell() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  /** Bumps on each open so StaggerItem remounts and cascade replays. */
  const [openGen, setOpenGen] = useState(0)
  const { items, unreadCount, isUnread, markRead, markAllRead } =
    useNotifications()

  const hasUnread = unreadCount > 0
  const ariaLabel = hasUnread
    ? t("notifications.ariaLabelUnread", { count: unreadCount })
    : t("notifications.ariaLabel")

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setOpenGen((g) => g + 1)
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label={ariaLabel}
          />
        }
      >
        <Bell className="size-4" />
        {hasUnread ? (
          <span
            className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive ring-2 ring-background"
            aria-hidden
          />
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className={cn(
          "w-[22rem] gap-0 overflow-hidden rounded-xl p-3 sm:w-96",
          "border-0 bg-popover/95 shadow-xl shadow-black/10 ring-1 ring-foreground/10",
          "backdrop-blur-xl dark:shadow-black/40"
        )}
      >
        <NotificationPanel
          items={items}
          unreadCount={unreadCount}
          isUnread={isUnread}
          markRead={(id) => {
            const item = items.find((n) => n.id === id)
            markRead(id)
            if (item?.href) setOpen(false)
          }}
          markAllRead={markAllRead}
          onViewAll={() => {
            setOpen(false)
            navigate("/notifications")
          }}
          openKey={openGen}
        />
      </PopoverContent>
    </Popover>
  )
}
