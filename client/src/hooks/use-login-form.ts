import { useCallback, useState } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginCredentials } from "@mockmatch/schemas"

export interface UseLoginFormResult {
  readonly form: UseFormReturn<LoginCredentials>
  readonly isSubmitting: boolean
  readonly isPasswordVisible: boolean
  readonly togglePasswordVisibility: () => void
  readonly onSubmit: () => void
}

export function useLoginForm(): UseLoginFormResult {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((previous) => !previous)
  }, [])

  const onSubmit = useCallback(() => {
    setIsSubmitting(true)

    // Dummy submit: no backend wired up yet.
    window.setTimeout(() => {
      setIsSubmitting(false)
    }, 600)
  }, [])

  return {
    form,
    isSubmitting,
    isPasswordVisible,
    togglePasswordVisibility,
    onSubmit,
  }
}
