import type { AppNotification, NotificationKind } from "./types"

/** Minutes/hours/days ago → ISO. */
function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString()
}

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/** Popover preview size. */
export const NOTIFICATION_PREVIEW_LIMIT = 7

/** Full-page infinite scroll page size. */
export const NOTIFICATION_PAGE_SIZE = 10

/** Total seeded catalog size (mock until API). */
export const NOTIFICATION_CATALOG_SIZE = 48

const ITEM_KEYS = [
  "welcome",
  "creditsGranted",
  "resumeExport",
  "collabShare",
  "practiceFeedback",
  "discoverFit",
  "billingReminder",
] as const

const KINDS: readonly NotificationKind[] = [
  "product",
  "credits",
  "success",
  "info",
  "success",
  "product",
  "warning",
]

const HREFS: readonly (string | undefined)[] = [
  "/resume-lab",
  "/billing",
  "/resume-lab",
  undefined,
  "/simulations",
  "/discover",
  "/billing",
]

/** Age offsets so the list feels recent → older as you scroll. */
function ageForIndex(index: number): number {
  if (index < 3) return (index + 1) * 8 * MIN
  if (index < 10) return (index - 2) * 45 * MIN
  if (index < 24) return (index - 8) * 8 * HOUR
  return (index - 20) * DAY
}

let cachedCatalog: AppNotification[] | null = null

/**
 * Full mock catalog (memoized per page load).
 * Swap for `trpc.notifications.list` — keep `AppNotification` shape.
 */
export function getNotificationCatalog(): readonly AppNotification[] {
  if (cachedCatalog) return cachedCatalog

  cachedCatalog = Array.from({ length: NOTIFICATION_CATALOG_SIZE }, (_, index) => {
    const template = index % ITEM_KEYS.length
    const itemKey = ITEM_KEYS[template]!
    return {
      id: index === 0 ? itemKey : `${itemKey}-${index}`,
      kind: KINDS[template]!,
      itemKey,
      createdAt: ago(ageForIndex(index)),
      href: HREFS[template],
    }
  })

  return cachedCatalog
}

export type NotificationPageResult = {
  readonly items: readonly AppNotification[]
  readonly nextOffset: number | undefined
  readonly total: number
}

/** Synchronous page slice (call after optional delay in hooks). */
export function getNotificationPage(
  offset: number,
  limit: number = NOTIFICATION_PAGE_SIZE
): NotificationPageResult {
  const catalog = getNotificationCatalog()
  const items = catalog.slice(offset, offset + limit)
  const next = offset + items.length
  return {
    items,
    nextOffset: next < catalog.length ? next : undefined,
    total: catalog.length,
  }
}

/** Popover: newest N. */
export function getNotificationPreview(
  limit: number = NOTIFICATION_PREVIEW_LIMIT
): readonly AppNotification[] {
  return getNotificationCatalog().slice(0, limit)
}
