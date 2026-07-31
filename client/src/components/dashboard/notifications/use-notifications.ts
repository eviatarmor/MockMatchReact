import { useCallback, useMemo, useSyncExternalStore } from "react"
import {
  getNotificationCatalog,
  getNotificationPreview,
} from "./mock-notifications"
import {
  getNotificationReadIdsServerSnapshot,
  getNotificationReadIdsSnapshot,
  isNotificationUnread,
  markNotificationRead,
  markNotificationsRead,
  subscribeNotificationReadIds,
} from "./notification-read-store"
import type { AppNotification } from "./types"

/** Popover inbox: preview slice + shared read state. */
export function useNotifications() {
  const readIds = useSyncExternalStore(
    subscribeNotificationReadIds,
    getNotificationReadIdsSnapshot,
    getNotificationReadIdsServerSnapshot
  )

  const items = useMemo(() => getNotificationPreview(), [])
  const catalog = useMemo(() => getNotificationCatalog(), [])

  const isUnread = useCallback(
    (id: string) => isNotificationUnread(id, readIds),
    [readIds]
  )

  const unreadCount = useMemo(
    () => catalog.filter((n) => isNotificationUnread(n.id, readIds)).length,
    [catalog, readIds]
  )

  const markRead = useCallback((id: string) => {
    markNotificationRead(id)
  }, [])

  const markAllRead = useCallback(() => {
    markNotificationsRead(catalog.map((n) => n.id))
  }, [catalog])

  return {
    items: items as readonly AppNotification[],
    unreadCount,
    isUnread,
    markRead,
    markAllRead,
  }
}
