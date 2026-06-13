import { useCallback, useState } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { resetPasswordSchema, type ResetPasswordCredentials } from "@mockmatch/schemas"

export interface UseResetPasswordFormResult {
  readonly form: UseFormReturn<ResetPasswordCredentials>
  readonly isSubmitting: boolean
  readonly isSuccess: boolean
  readonly isPasswordVisible: boolean
  readonly isConfirmPasswordVisible: boolean
  readonly togglePasswordVisibility: () => void
  readonly toggleConfirmPasswordVisibility: () => void
  readonly onSubmit: () => void
}

// Dummy submit: no backend wired up yet.
const resetPasswordRequest: (credentials: ResetPasswordCredentials) => Promise<void> = () =>
  new Promise((resolve) => window.setTimeout(resolve, 600))

export function useResetPasswordForm(): UseResetPasswordFormResult {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  const form = useForm<ResetPasswordCredentials>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: resetPasswordRequest,
  })

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((previous) => !previous)
  }, [])

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setIsConfirmPasswordVisible((previous) => !previous)
  }, [])

  const onSubmit = useCallback(() => {
    mutate(form.getValues())
  }, [mutate, form])

  return {
    form,
    isSubmitting: isPending,
    isSuccess,
    isPasswordVisible,
    isConfirmPasswordVisible,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    onSubmit,
  }
}
