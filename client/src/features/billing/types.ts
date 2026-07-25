import type { LucideIcon } from "lucide-react"
import type {
  BillingSummary,
  CreditPack,
  DateFormat,
  InvoiceDto,
} from "@mockmatch/schemas"
import { formatDate } from "@/lib/format-datetime"

export type SectionId = "usage" | "payment" | "history"

export interface NavItem {
  readonly id: SectionId
  readonly labelKey: string
  readonly icon: LucideIcon
}

export type { BillingSummary, CreditPack, InvoiceDto }

export type CardBrand = "mastercard" | "visa" | "amex" | "discover" | "unknown"

export function mapCardBrand(brand: string | null | undefined): CardBrand {
  const normalized = (brand ?? "").toLowerCase()
  if (normalized === "mastercard" || normalized === "visa" || normalized === "amex" || normalized === "discover") {
    return normalized
  }
  if (normalized.includes("master")) return "mastercard"
  if (normalized.includes("visa")) return "visa"
  return "unknown"
}

export function formatCardExpiry(
  month: number | null | undefined,
  year: number | null | undefined
): string {
  if (!month || !year) return "—"
  const mm = String(month).padStart(2, "0")
  const yy = String(year).slice(-2)
  return `${mm}/${yy}`
}

export function formatMoney(amountCents: number, currency = "usd"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100)
  } catch {
    return `$${(amountCents / 100).toFixed(2)}`
  }
}

/** Invoice date using the user's region date format. */
export function formatInvoiceDate(iso: string, dateFormat: DateFormat): string {
  return formatDate(iso, dateFormat)
}
