import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useInView } from "react-intersection-observer"
import { BellOff } from "lucide-react"
import { StaggerItem } from "@mockmatch/ui/stagger"
import { Button } from "@mockmatch/ui/button"
import { Skeleton } from "@mockmatch/ui/skeleton"
import { Spinner } from "@mockmatch/ui/spinner"
import { BreadcrumbPage } from "@mockmatch/ui/breadcrumb"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { NotificationItem } from "@/components/dashboard/notifications/notification-item"
import {
  formatDayDateLabel,
  getDayLabelKind,
  groupNotificationsByDay,
} from "@/components/dashboard/notifications/group-by-day"
import { useNotificationsInfinite } from "@/components/dashboard/notifications/use-notifications-infinite"
import { useNavbarSlots } from "@/hooks/use-navbar-slots"

function NotificationRowSkeleton() {
  return (
    <div className="flex gap-3 rounded-xl px-2.5 py-2.5">
      <Skeleton className="size-9 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-40 max-w-[40%]" />
        <Skeleton className="h-3 w-full max-w-md" />
        <Skeleton className="h-3 w-56 max-w-[60%]" />
      </div>
    </div>
  )
}

function useDaySectionLabel(dayKey: string): string {
  const { t, i18n } = useTranslation("common")
  const kind = getDayLabelKind(dayKey)

  if (kind === "today") return t("notifications.dates.today")
  if (kind === "yesterday") return t("notifications.dates.yesterday")
  if (kind === "unknown") return t("notifications.dates.unknown")
  return formatDayDateLabel(dayKey, i18n.language)
}

function DaySectionHeader({ dayKey }: { readonly dayKey: string }) {
  const label = useDaySectionLabel(dayKey)

  // Sits above the day card (not sticky, not inside the bordered card).
  return (
    <h2 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {label}
    </h2>
  )
}

export function NotificationsPageContent() {
  const { t } = useTranslation("common")
  const {
    items,
    unreadCount,
    isUnread,
    markRead,
    markAllRead,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useNotificationsInfinite()

  useNavbarSlots({
    crumb: <BreadcrumbPage>{t("notifications.title")}</BreadcrumbPage>,
  })

  const dayGroups = useMemo(() => groupNotificationsByDay(items), [items])

  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: "160px",
    threshold: 0,
  })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage])

  let staggerIndex = 0

  return (
    <DashboardPageShell title={t("notifications.title")}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <DashboardPageHeader
            title={t("notifications.title")}
            description={t("notifications.pageDescription")}
          />
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 cursor-pointer self-start"
              onClick={markAllRead}
            >
              {t("notifications.markAllRead")}
            </Button>
          ) : null}
        </div>

        {isError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
            {t("notifications.loadError")}
          </p>
        ) : null}

        {isLoading ? (
          <ul
            className="flex flex-col gap-0.5"
            aria-busy="true"
            aria-label={t("notifications.loading")}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i}>
                <NotificationRowSkeleton />
              </li>
            ))}
          </ul>
        ) : null}

        {!isLoading && !isError && items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-14 text-center shadow-sm ring-1 ring-foreground/5">
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground ring-1 ring-border/60">
              <BellOff className="size-5" aria-hidden />
            </span>
            <p className="text-sm font-medium text-foreground">
              {t("notifications.emptyTitle")}
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              {t("notifications.emptyDescription")}
            </p>
          </div>
        ) : null}

        {!isLoading && !isError && items.length > 0 ? (
          <>
            {unreadCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("notifications.unreadCount", { count: unreadCount })}
              </p>
            ) : null}

            <div className="flex flex-col gap-6" aria-busy={isFetchingNextPage}>
              {dayGroups.map((group) => (
                <section
                  key={group.dayKey}
                  className="flex flex-col gap-2"
                  aria-labelledby={`notifications-day-${group.dayKey}`}
                >
                  <div id={`notifications-day-${group.dayKey}`}>
                    <DaySectionHeader dayKey={group.dayKey} />
                  </div>

                  <ul className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-card p-1.5 shadow-sm ring-1 ring-foreground/5">
                    {group.items.map((notification) => {
                      const index = staggerIndex
                      staggerIndex += 1
                      return (
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
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>

            <div ref={loadMoreRef} className="h-1 w-full" aria-hidden />

            {isFetchingNextPage ? (
              <div
                className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
                aria-busy="true"
                aria-label={t("notifications.loading")}
              >
                <Spinner className="size-4" />
                {t("notifications.loadingMore")}
              </div>
            ) : null}

            {!hasNextPage && items.length > 0 ? (
              <p className="pb-6 text-center text-xs text-muted-foreground">
                {t("notifications.endOfList")}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </DashboardPageShell>
  )
}
