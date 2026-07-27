import type { EmailProviderDef, TrackingStatus } from "./types"

export {
  TRACKING_STATUS_ORDER,
  TRACKING_PIPELINE_ORDER,
  TRACKING_STATUS_TRENDS,
  MOCK_TRACKED_JOBS,
} from "@/features/discover/constants"

/** Status color dots — shared by kanban header + table status select. */
export const STATUS_DOT_CLASS: Record<TrackingStatus, string> = {
  saved: "bg-neutral-400",
  applied: "bg-blue-500",
  interviewing: "bg-amber-500",
  offer: "bg-emerald-500",
  declined: "bg-rose-500",
}

export const EMAIL_PROVIDERS: readonly EmailProviderDef[] = [
  {
    id: "google",
    labelKey: "applications.email.providers.google",
    connectKey: "applications.email.connect.google",
  },
  {
    id: "microsoft",
    labelKey: "applications.email.providers.microsoft",
    connectKey: "applications.email.connect.microsoft",
  },
  {
    id: "apple",
    labelKey: "applications.email.providers.apple",
    connectKey: "applications.email.connect.apple",
  },
  {
    id: "yahoo",
    labelKey: "applications.email.providers.yahoo",
    connectKey: "applications.email.connect.yahoo",
  },
] as const
