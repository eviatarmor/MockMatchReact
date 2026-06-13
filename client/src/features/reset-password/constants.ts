import type { ResetPasswordChecklistItem } from "@/features/reset-password/types"

export const RESET_PASSWORD_CHECKLIST: readonly ResetPasswordChecklistItem[] = [
  { id: "minLength", icon: "lock", labelKey: "checklist.minLength" },
  { id: "mixedCase", icon: "case", labelKey: "checklist.mixedCase" },
  { id: "numberAndSymbol", icon: "hash", labelKey: "checklist.numberAndSymbol" },
]
