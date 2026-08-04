import { BellOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StaggerItem } from "@mockmatch/ui/stagger"
import { Button } from "@mockmatch/ui/button"
import { NotificationItem } from "./notification-item"
import type { AppNotification } from "./types"

interface NotificationPanelProps {
  readonly items: readonly AppNotification[]
  readonly unreadCount: number
  readonly isUnread: (id: string) => boolean
  readonly markRead: (id: string) => void
  readonly markAllRead: () => void
  readonly onViewAll: () => void
  /** Remount key so stagger cascade replays each open */
  readonly openKey: number
}

export function NotificationPanel({
  items,
  unreadCount,
  isUnread,
  markRead,
  markAllRead,
  onViewAll,
  openKey,
}: NotificationPanelProps) {
  const { t } = useTranslation("common")
  const empty = items.length === 0

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 px-1 pb-1">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {t("notifications.title")}
          </h2>
          {unreadCount > 0 ? (
            <p className="text-2xs text-muted-foreground">
              {t("notifications.unreadCount", { count: unreadCount })}
            </p>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={markAllRead}
          >
            {t("notifications.markAllRead")}
          </Button>
        ) : null}
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground ring-1 ring-border/60">
            <BellOff className="size-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t("notifications.emptyTitle")}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("notifications.emptyDescription")}
            </p>
          </div>
        </div>
      ) : (
        <div className="h-[min(24rem,70vh)] w-full overflow-y-auto">
          <ul key={openKey} className="flex flex-col gap-0.5 pr-2">
            {items.map((notification, index) => (
              <StaggerItem
                key={notification.id}
                as="li"
                index={index}
                direction="up"
              >
                <NotificationItem
                  notification={notification}
                  unread={isUnread(notification.id)}
                  onActivate={markRead}
                />
              </StaggerItem>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-border/60 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-full cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={onViewAll}
        >
          {t("notifications.viewAll")}
        </Button>
      </div>
    </div>
  )
}
