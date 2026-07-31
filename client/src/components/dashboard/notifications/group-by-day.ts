import type { AppNotification } from "./types"

export type NotificationDayGroup = {
  readonly dayKey: string
  readonly items: readonly AppNotification[]
}

/** Local calendar day key `YYYY-MM-DD` (not UTC). */
export function toLocalDayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function dayKeyFromIso(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "unknown"
  return toLocalDayKey(date)
}

/** Preserve load order; new dayKey starts a group (items assumed newest-first). */
export function groupNotificationsByDay(
  items: readonly AppNotification[]
): NotificationDayGroup[] {
  const groups: { dayKey: string; items: AppNotification[] }[] = []

  for (const item of items) {
    const dayKey = dayKeyFromIso(item.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.dayKey === dayKey) {
      last.items.push(item)
    } else {
      groups.push({ dayKey, items: [item] })
    }
  }

  return groups
}

function parseDayKey(dayKey: string): Date | null {
  if (dayKey === "unknown") return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey)
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2]) - 1
  const d = Number(match[3])
  return new Date(y, m, d)
}

export type DayLabelKind = "today" | "yesterday" | "date" | "unknown"

export function getDayLabelKind(
  dayKey: string,
  now: Date = new Date()
): DayLabelKind {
  if (dayKey === "unknown") return "unknown"

  const todayKey = toLocalDayKey(now)
  if (dayKey === todayKey) return "today"

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (dayKey === toLocalDayKey(yesterday)) return "yesterday"

  return "date"
}

/** Formatted calendar label when not Today/Yesterday. */
export function formatDayDateLabel(
  dayKey: string,
  locale?: string,
  now: Date = new Date()
): string {
  const date = parseDayKey(dayKey)
  if (!date) return dayKey

  const sameYear = date.getFullYear() === now.getFullYear()
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date)
}
