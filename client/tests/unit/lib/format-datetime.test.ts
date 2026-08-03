import { describe, expect, it } from "vitest"
import { formatDate, formatDateTime, formatTime } from "@/lib/format-datetime"

describe("formatDate", () => {
  const d = new Date(2026, 0, 5) // local Jan 5 2026

  it("formats patterns", () => {
    expect(formatDate(d, "DD/MM/YYYY")).toBe("05/01/2026")
    expect(formatDate(d, "YYYY/MM/DD")).toBe("2026/01/05")
    expect(formatDate(d, "MM/DD/YYYY")).toBe("01/05/2026")
  })

  it("handles invalid", () => {
    expect(formatDate("bad", "MM/DD/YYYY")).toBe("bad")
  })
})

describe("formatTime / formatDateTime", () => {
  const d = new Date(2026, 0, 5, 14, 30)

  it("formats 24h", () => {
    const t = formatTime(d, "24h")
    expect(t).toMatch(/14:30|2:30/)
  })

  it("joins date and time", () => {
    const s = formatDateTime(d, "YYYY/MM/DD", "24h")
    expect(s).toContain("2026/01/05")
    expect(s).toContain("·")
  })
})
