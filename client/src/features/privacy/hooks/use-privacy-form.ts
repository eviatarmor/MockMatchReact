import { useEffect, useRef } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { MOCK_PRIVACY, PRIVACY_AUTO_SAVE_DEBOUNCE_MS } from "@/features/privacy/constants"
import type { PrivacyForm } from "@/features/privacy/types"

export interface UsePrivacyFormResult {
  readonly form: UseFormReturn<PrivacyForm>
}

// Dummy save: no backend wired up yet.
const savePrivacy: (values: PrivacyForm) => Promise<void> = () =>
  new Promise((resolve) => window.setTimeout(resolve, 600))

export function usePrivacyForm(): UsePrivacyFormResult {
  const { t } = useTranslation("privacy")

  const form = useForm<PrivacyForm>({
    mode: "onChange",
    defaultValues: MOCK_PRIVACY,
  })

  const { mutate } = useMutation({
    mutationFn: savePrivacy,
    onSuccess: () => {
      toast.success(t("toast.saved"))
    },
    onError: () => {
      toast.error(t("toast.saveErrorTitle"), {
        description: t("toast.saveErrorDescription"),
      })
    },
  })

  // Debounced auto-save: persist toggle changes ~1s after the last change.
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const subscription = form.watch(() => {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => {
        mutate(form.getValues())
      }, PRIVACY_AUTO_SAVE_DEBOUNCE_MS)
    })

    return () => {
      subscription.unsubscribe()
      window.clearTimeout(timeoutRef.current)
    }
  }, [form, mutate])

  return { form }
}
