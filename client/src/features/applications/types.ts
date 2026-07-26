export type { TrackedJob, TrackingStatus } from "@/features/discover/types"

export type EmailProvider = "google" | "microsoft" | "apple" | "yahoo"

export interface EmailProviderDef {
  readonly id: EmailProvider
  readonly labelKey: string
  readonly connectKey: string
}
