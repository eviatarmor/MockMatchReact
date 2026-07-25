import type { DateFormat, TimeFormat } from "@mockmatch/schemas"

export type DateTimeInput = Date | string | number

function toDate(value: DateTimeInput): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

/** Format a date with the user's preferred pattern (region settings). */
export function formatDate(value: DateTimeInput, format: DateFormat): string {
  const date = toDate(value)
  if (!date) return typeof value === "string" ? value : ""

  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const yyyy = String(date.getFullYear())

  if (format === "DD/MM/YYYY") return `${dd}/${mm}/${yyyy}`
  if (format === "YYYY/MM/DD") return `${yyyy}/${mm}/${dd}`
  return `${mm}/${dd}/${yyyy}`
}

/** Format a time with the user's preferred 12h / 24h clock. */
export function formatTime(value: DateTimeInput, format: TimeFormat): string {
  const date = toDate(value)
  if (!date) return typeof value === "string" ? value : ""

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: format === "12h",
  })
}

/** Date + time joined with a middle dot (settings preview / collab expiry style). */
export function formatDateTime(
  value: DateTimeInput,
  dateFormat: DateFormat,
  timeFormat: TimeFormat
): string {
  const date = toDate(value)
  if (!date) return typeof value === "string" ? value : ""
  return `${formatDate(date, dateFormat)} · ${formatTime(date, timeFormat)}`
}
