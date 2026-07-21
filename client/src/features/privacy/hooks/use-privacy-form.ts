import { useEffect, useRef } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  MOCK_PRIVACY,
  PRIVACY_AUTO_SAVE_DEBOUNCE_MS,
} from "@/features/privacy/constants"
import type { PrivacyForm } from "@/features/privacy/types"
import { useDebouncedFormSave } from "@/hooks/use-debounced-form-save"
import { trpc } from "@/lib/trpc"

export interface UsePrivacyFormResult {
  readonly form: UseFormReturn<PrivacyForm>
  readonly isLoading: boolean
}

export function usePrivacyForm(): UsePrivacyFormResult {
  const { t } = useTranslation("privacy")
  const utils = trpc.useUtils()
  const hydratedRef = useRef(false)

  const accountQuery = trpc.account.get.useQuery()

  const form = useForm<PrivacyForm>({
    mode: "onChange",
    defaultValues: MOCK_PRIVACY,
  })

  useEffect(() => {
    if (!accountQuery.data || hydratedRef.current) return
    form.reset(accountQuery.data.preferences.privacy)
    hydratedRef.current = true
  }, [accountQuery.data, form])

  const updatePreferences = trpc.account.updatePreferences.useMutation({
    onSuccess: async () => {
      await utils.account.get.invalidate()
      toast.success(t("toast.saved"))
    },
    onError: () => {
      toast.error(t("toast.saveErrorTitle"), {
        description: t("toast.saveErrorDescription"),
      })
    },
  })

  useDebouncedFormSave({
    form,
    debounceMs: PRIVACY_AUTO_SAVE_DEBOUNCE_MS,
    enabled: Boolean(accountQuery.data),
    validate: false,
    onSave: (values) => {
      updatePreferences.mutate({ privacy: values })
    },
  })

  return { form, isLoading: accountQuery.isLoading }
}
