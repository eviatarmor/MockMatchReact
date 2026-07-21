import { Gauge, CreditCard, ReceiptText } from "lucide-react"
import type { NavItem } from "@/features/billing/types"

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "usage", labelKey: "nav.usage", icon: Gauge },
  { id: "payment", labelKey: "nav.payment", icon: CreditCard },
  { id: "history", labelKey: "nav.history", icon: ReceiptText },
]

export const BREAKDOWN_LABEL_KEYS = {
  mockInterviews: "usage.breakdown.mockInterviews",
  resumeScans: "usage.breakdown.resumeScans",
  coverLetters: "usage.breakdown.coverLetters",
} as const
