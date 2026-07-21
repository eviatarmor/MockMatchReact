import { useEffect, useRef } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AUTO_SAVE_DEBOUNCE_MS } from "@/features/account-settings/constants"
import type { AccountSettingsForm } from "@/features/account-settings/types"
import { useDebouncedFormSave } from "@/hooks/use-debounced-form-save"
import { setUser } from "@/lib/auth/session"
import { trpc } from "@/lib/trpc"

export interface UseAccountSettingsFormResult {
  readonly form: UseFormReturn<AccountSettingsForm>
  readonly email: string
  readonly isLoading: boolean
  readonly isSaving: boolean
}

const emptyDefaults: AccountSettingsForm = {
  fullName: "",
  voiceProfile: "mellow",
  country: "US",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
}

export function useAccountSettingsForm(): UseAccountSettingsFormResult {
  const { t } = useTranslation("account-settings")
  const utils = trpc.useUtils()
  const hydratedRef = useRef(false)

  const accountQuery = trpc.account.get.useQuery()

  const form = useForm<AccountSettingsForm>({
    mode: "onChange",
    defaultValues: emptyDefaults,
  })

  // Seed form once from server — avoid reset after autosave (would re-trigger save).
  useEffect(() => {
    if (!accountQuery.data || hydratedRef.current) return
    const { fullName, preferences } = accountQuery.data
    form.reset({
      fullName: fullName ?? "",
      voiceProfile: preferences.voiceProfile,
      country: preferences.country,
      dateFormat: preferences.dateFormat,
      timeFormat: preferences.timeFormat,
    })
    hydratedRef.current = true
  }, [accountQuery.data, form])

  const updateProfile = trpc.account.updateProfile.useMutation()
  const updatePreferences = trpc.account.updatePreferences.useMutation()

  const isSaving = updateProfile.isPending || updatePreferences.isPending

  useDebouncedFormSave({
    form,
    debounceMs: AUTO_SAVE_DEBOUNCE_MS,
    enabled: Boolean(accountQuery.data),
    onSave: (values) => {
      void (async () => {
        try {
          const [profile] = await Promise.all([
            updateProfile.mutateAsync({ fullName: values.fullName }),
            updatePreferences.mutateAsync({
              voiceProfile: values.voiceProfile,
              country: values.country,
              dateFormat: values.dateFormat,
              timeFormat: values.timeFormat,
            }),
          ])
          setUser({
            id: profile.id,
            email: profile.email,
            fullName: profile.fullName,
          })
          await Promise.all([
            utils.account.get.invalidate(),
            utils.auth.me.invalidate(),
            utils.billing.summary.invalidate(),
          ])
          toast.success(t("toast.saved"))
        } catch {
          toast.error(t("toast.saveErrorTitle"), {
            description: t("toast.saveErrorDescription"),
          })
        }
      })()
    },
  })

  return {
    form,
    email: accountQuery.data?.email ?? "",
    isLoading: accountQuery.isLoading,
    isSaving,
  }
}
