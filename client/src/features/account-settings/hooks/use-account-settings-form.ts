import { useEffect, useRef } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AUTO_SAVE_DEBOUNCE_MS } from "@/features/account-settings/constants"
import type { AccountSettingsForm } from "@/features/account-settings/types"
import { useDebouncedFormSave } from "@/hooks/use-debounced-form-save"
import { setUser } from "@/lib/auth/session"
import { setAppLanguage } from "@/lib/i18n"
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
  language: "en-AU",
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
      language: preferences.language,
      country: preferences.country,
      dateFormat: preferences.dateFormat,
      timeFormat: preferences.timeFormat,
    })
    // Server language is source of truth when logged in.
    setAppLanguage(preferences.language)
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
          const [profile, account] = await Promise.all([
            updateProfile.mutateAsync({ fullName: values.fullName }),
            updatePreferences.mutateAsync({
              voiceProfile: values.voiceProfile,
              language: values.language,
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
          // Immediate cache write so Discover/region hooks see country/language without a race.
          utils.account.get.setData(undefined, account)
          // Toast before invalidate — same UX as privacy; don't wait on refetch.
          toast.success(t("toast.saved"), { id: "account-settings-saved" })
          void Promise.all([
            utils.account.get.invalidate(),
            // Country drives Adzuna market — drop all cached job pages.
            utils.jobs.search.invalidate(),
            utils.auth.me.invalidate(),
            utils.billing.summary.invalidate(),
          ])
        } catch {
          toast.error(t("toast.saveErrorTitle"), {
            id: "account-settings-save-error",
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
