import { bench, describe } from "vitest"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { scoreBand } from "@/lib/score-tier"
import { titleToAvatarText } from "@/lib/title-avatar"
import { formatDate, formatDateTime } from "@/lib/format-datetime"

const now = Date.parse("2026-06-01T12:00:00.000Z")
const iso = new Date(now - 3_600_000).toISOString()
const d = new Date(2026, 5, 1, 14, 30)

describe("client pure formatters (list/table hot path)", () => {
  bench("formatRelativeTime", () => {
    formatRelativeTime(iso, now)
  })

  bench("scoreBand", () => {
    scoreBand(72)
  })

  bench("titleToAvatarText", () => {
    titleToAvatarText("Senior Software Engineer")
  })

  bench("formatDateTime", () => {
    formatDateTime(d, "YYYY/MM/DD", "24h")
  })

  bench("formatDate DD/MM/YYYY", () => {
    formatDate(d, "DD/MM/YYYY")
  })
})
