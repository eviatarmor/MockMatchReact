import { useEffect, useRef } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AUTO_SAVE_DEBOUNCE_MS, MOCK_ACCOUNT } from "@/features/account-settings/constants"
import type { AccountSettingsForm } from "@/features/account-settings/types"

export interface UseAccountSettingsFormResult {
  readonly form: UseFormReturn<AccountSettingsForm>
  readonly email: string
  readonly isSaving: boolean
}

// Dummy save: no backend wired up yet.
const saveSettings: (values: AccountSettingsForm) => Promise<void> = () =>
  new Promise((resolve) => window.setTimeout(resolve, 600))

const defaultValues: AccountSettingsForm = {
  fullName: MOCK_ACCOUNT.fullName,
  voiceProfile: MOCK_ACCOUNT.voiceProfile,
  country: MOCK_ACCOUNT.country,
  dateFormat: MOCK_ACCOUNT.dateFormat,
  timeFormat: MOCK_ACCOUNT.timeFormat,
}

export function useAccountSettingsForm(): UseAccountSettingsFormResult {
  const { t } = useTranslation("account-settings")

  const form = useForm<AccountSettingsForm>({
    mode: "onChange",
    defaultValues,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast.success(t("toast.saved"))
    },
    onError: () => {
      toast.error(t("toast.saveErrorTitle"), {
        description: t("toast.saveErrorDescription"),
      })
    },
  })

  // Debounced auto-save: persist valid changes ~1s after the user stops editing.
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const subscription = form.watch(() => {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(async () => {
        const valid = await form.trigger()
        if (valid) mutate(form.getValues())
      }, AUTO_SAVE_DEBOUNCE_MS)
    })

    return () => {
      subscription.unsubscribe()
      window.clearTimeout(timeoutRef.current)
    }
  }, [form, mutate])

  return { form, email: MOCK_ACCOUNT.email, isSaving: isPending }
}
