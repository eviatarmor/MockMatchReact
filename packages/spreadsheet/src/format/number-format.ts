import type { NumberFormatId } from "../types"

/** Apply display format to a computed numeric value. */
export function formatNumberValue(
  n: number,
  format: NumberFormatId | undefined
): string {
  if (!Number.isFinite(n)) return String(n)
  const f = format ?? "general"
  switch (f) {
    case "integer":
      return String(Math.round(n))
    case "number":
      return n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    case "percent":
      return `${(n * 100).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`
    case "currency":
      return n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })
    case "general":
    default: {
      if (Number.isInteger(n)) return String(n)
      const s = n.toPrecision(10)
      return String(Number(s))
    }
  }
}

/** Cycle / set helpers for keyboard shortcuts. */
export function parseNumberFormatId(
  v: string | undefined | null
): NumberFormatId | null {
  if (!v) return null
  if (
    v === "general" ||
    v === "number" ||
    v === "percent" ||
    v === "currency" ||
    v === "integer"
  ) {
    return v
  }
  return null
}
