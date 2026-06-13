import type { ForgotPasswordChecklistItem } from "@/features/forgot-password/types"

export const RESEND_COOLDOWN_SECONDS = 30

export const FORGOT_PASSWORD_CHECKLIST: readonly ForgotPasswordChecklistItem[] = [
  { id: "arrivesQuickly", icon: "mail", labelKey: "checklist.arrivesQuickly" },
  { id: "expires", icon: "timer", labelKey: "checklist.expires" },
  { id: "secure", icon: "lock", labelKey: "checklist.secure" },
]
