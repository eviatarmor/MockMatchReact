import { describe, expect, it } from "vitest"
import { formatRelativeTime } from "@/lib/format-relative-time"

describe("formatRelativeTime", () => {
  const now = Date.parse("2026-01-15T12:00:00.000Z")

  it("returns relative units", () => {
    expect(formatRelativeTime(new Date(now - 30_000).toISOString(), now)).toMatch(
      /second|now|ago|in/i
    )
    expect(
      formatRelativeTime(new Date(now - 5 * 60_000).toISOString(), now)
    ).toMatch(/minute/i)
    expect(
      formatRelativeTime(new Date(now - 3 * 3600_000).toISOString(), now)
    ).toMatch(/hour/i)
  })

  it("returns input when unparseable", () => {
    expect(formatRelativeTime("not-a-date", now)).toBe("not-a-date")
  })
})
