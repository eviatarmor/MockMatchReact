import type { LucideIcon } from "lucide-react"

export type SectionId = "usage" | "payment" | "history"

export interface NavItem {
  readonly id: SectionId
  readonly labelKey: string
  readonly icon: LucideIcon
}

export interface Plan {
  readonly nameKey: string
  readonly priceKey: string
  readonly renewalDate: string
}

export interface FeatureUsage {
  readonly id: string
  readonly labelKey: string
  readonly used: number
}

export interface CreditUsage {
  readonly total: number
  readonly used: number
  readonly breakdown: readonly FeatureUsage[]
}

export type CardBrand = "mastercard" | "visa"

export interface PaymentCard {
  readonly holder: string
  readonly last4: string
  readonly expiry: string
  readonly brand: CardBrand
}

export interface BillingDetails {
  readonly name: string
  readonly email: string
  readonly addressLine: string
  readonly city: string
  readonly country: string
}

export type InvoiceStatus = "paid" | "pending"

export interface Invoice {
  readonly id: string
  readonly date: string
  readonly amount: string
  readonly status: InvoiceStatus
}

export interface BillingData {
  readonly plan: Plan
  readonly credits: CreditUsage
  readonly card: PaymentCard
  readonly details: BillingDetails
  readonly invoices: readonly Invoice[]
}
