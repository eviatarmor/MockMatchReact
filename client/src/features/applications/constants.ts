import type { EmailProviderDef } from "./types"

export {
  TRACKING_STATUS_ORDER,
  TRACKING_PIPELINE_ORDER,
  TRACKING_STATUS_TRENDS,
  MOCK_TRACKED_JOBS,
} from "@/features/discover/constants"

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
