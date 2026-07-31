import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import {
  getNotificationCatalog,
  getNotificationPage,
  NOTIFICATION_PAGE_SIZE,
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

const MOCK_LATENCY_MS = 320

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * Full-page paginated notifications (mock).
 * Later: swap body for `trpc.notifications.list.useInfiniteQuery`.
 */
export function useNotificationsInfinite() {
  const readIds = useSyncExternalStore(
    subscribeNotificationReadIds,
    getNotificationReadIdsSnapshot,
    getNotificationReadIdsServerSnapshot
  )

  const [items, setItems] = useState<AppNotification[]>([])
  const [nextOffset, setNextOffset] = useState<number | undefined>(0)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [isError, setIsError] = useState(false)
  const loadingRef = useRef(false)

  const hasNextPage = nextOffset !== undefined

  const fetchPage = useCallback(async (offset: number, append: boolean) => {
    if (loadingRef.current) return
    loadingRef.current = true
    if (append) setIsFetchingNextPage(true)
    else {
      setIsLoading(true)
      setIsError(false)
    }

    try {
      await delay(MOCK_LATENCY_MS)
      const page = getNotificationPage(offset, NOTIFICATION_PAGE_SIZE)
      setItems((prev) => (append ? [...prev, ...page.items] : [...page.items]))
      setNextOffset(page.nextOffset)
      setTotal(page.total)
    } catch {
      setIsError(true)
    } finally {
      loadingRef.current = false
      setIsLoading(false)
      setIsFetchingNextPage(false)
    }
  }, [])

  useEffect(() => {
    void fetchPage(0, false)
  }, [fetchPage])

  const fetchNextPage = useCallback(() => {
    if (nextOffset === undefined || loadingRef.current) return
    void fetchPage(nextOffset, true)
  }, [fetchPage, nextOffset])

  const isUnread = useCallback(
    (id: string) => isNotificationUnread(id, readIds),
    [readIds]
  )

  const unreadCount = useMemo(() => {
    const catalog = getNotificationCatalog()
    return catalog.filter((n) => isNotificationUnread(n.id, readIds)).length
  }, [readIds])

  const markRead = useCallback((id: string) => {
    markNotificationRead(id)
  }, [])

  const markAllRead = useCallback(() => {
    markNotificationsRead(getNotificationCatalog().map((n) => n.id))
  }, [])

  return {
    items: items as readonly AppNotification[],
    total,
    unreadCount,
    isUnread,
    markRead,
    markAllRead,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  }
}
