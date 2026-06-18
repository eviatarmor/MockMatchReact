import { Gauge, CreditCard, ReceiptText } from "lucide-react"
import type { NavItem, BillingData } from "@/features/billing/types"

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "usage", labelKey: "nav.usage", icon: Gauge },
  { id: "payment", labelKey: "nav.payment", icon: CreditCard },
  { id: "history", labelKey: "nav.history", icon: ReceiptText },
]

// Mock data — no backend wired up yet.
export const MOCK_BILLING: BillingData = {
  plan: {
    nameKey: "usage.plans.pro",
    priceKey: "usage.price.pro",
    renewalDate: "July 14, 2026",
  },
  credits: {
    total: 500,
    used: 320,
    breakdown: [
      { id: "mockInterviews", labelKey: "usage.breakdown.mockInterviews", used: 180 },
      { id: "resumeScans", labelKey: "usage.breakdown.resumeScans", used: 90 },
      { id: "coverLetters", labelKey: "usage.breakdown.coverLetters", used: 50 },
    ],
  },
  card: {
    holder: "Jordan Avery",
    last4: "8374",
    expiry: "08/28",
    brand: "mastercard",
  },
  details: {
    name: "Jordan Avery",
    email: "jordan.avery@example.com",
    addressLine: "204 Market Street",
    city: "San Francisco, CA 94103",
    country: "United States",
  },
  invoices: [
    { id: "INV-2026-006", date: "Jun 14, 2026", amount: "$29.00", status: "paid" },
    { id: "INV-2026-005", date: "May 14, 2026", amount: "$29.00", status: "paid" },
    { id: "INV-2026-004", date: "Apr 14, 2026", amount: "$29.00", status: "paid" },
    { id: "INV-2026-003", date: "Mar 14, 2026", amount: "$29.00", status: "paid" },
    { id: "INV-2026-002", date: "Feb 14, 2026", amount: "$29.00", status: "pending" },
  ],
}
